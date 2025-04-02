document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const todoList = document.getElementById('todo-list');
    const todoForm = document.getElementById('todo-form');
    const editTodoForm = document.getElementById('edit-todo-form');
    const categoryList = document.getElementById('category-list');
    const currentViewTitle = document.getElementById('current-view');

    // Modal elements
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));

    // Buttons and inputs
    const saveButton = document.getElementById('save-todo');
    const updateButton = document.getElementById('update-todo');
    const deleteButton = document.getElementById('delete-todo');

    // Nav items
    const allTasksNav = document.getElementById('all-tasks');
    const completedTasksNav = document.getElementById('completed-tasks');
    const pendingTasksNav = document.getElementById('pending-tasks');

    // Current filter state
    let currentFilter = 'all';
    let currentCategory = null;

    // Load todos from API
    loadTodos();

    // Event listeners
    saveButton.addEventListener('click', saveTodo);
    updateButton.addEventListener('click', updateTodo);
    deleteButton.addEventListener('click', deleteTodo);

    // Filter navigation
    allTasksNav.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveNav(this);
        currentFilter = 'all';
        currentCategory = null;
        currentViewTitle.textContent = 'All Tasks';
        renderTodos();
    });

    completedTasksNav.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveNav(this);
        currentFilter = 'completed';
        currentCategory = null;
        currentViewTitle.textContent = 'Completed Tasks';
        renderTodos();
    });

    pendingTasksNav.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveNav(this);
        currentFilter = 'pending';
        currentCategory = null;
        currentViewTitle.textContent = 'Pending Tasks';
        renderTodos();
    });

    // Functions
    async function loadTodos() {
        try {
            const response = await fetch('/api/todos');
            if (!response.ok) {
                throw new Error('Failed to fetch todos');
            }

            const todos = await response.json();
            saveTodosToLocalStorage(todos);
            renderTodos();
            updateCategoryFilters();

        } catch (error) {
            console.error('Error loading todos:', error);
            showErrorToast('Failed to load tasks. Please try again.');

            // Fallback to local storage
            const storedTodos = getTodosFromLocalStorage();
            if (storedTodos && storedTodos.length > 0) {
                renderTodos();
                updateCategoryFilters();
            }
        }
    }

    function renderTodos() {
        let todos = getTodosFromLocalStorage();
        todoList.innerHTML = '';

        // Apply filters
        if (currentFilter === 'completed') {
            todos = todos.filter(todo => todo.completed);
        } else if (currentFilter === 'pending') {
            todos = todos.filter(todo => !todo.completed);
        }

        if (currentCategory) {
            todos = todos.filter(todo => todo.category === currentCategory);
        }

        // Sort by priority (high to low) and then by creation date (newest first)
        todos.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        if (todos.length === 0) {
            renderEmptyState();
            return;
        }

        todos.forEach(todo => {
            const todoCard = createTodoCard(todo);
            todoList.appendChild(todoCard);
        });
    }

    function createTodoCard(todo) {
        const col = document.createElement('div');
        col.className = 'col fade-in';

        const cardClass = todo.completed ? 'todo-card todo-completed' : 'todo-card';

        // Determine priority class
        let priorityClass = '';
        let priorityText = '';

        switch (parseInt(todo.priority)) {
            case 1:
                priorityClass = 'priority-low';
                priorityText = 'Low';
                break;
            case 2:
                priorityClass = 'priority-medium';
                priorityText = 'Medium';
                break;
            case 3:
                priorityClass = 'priority-high';
                priorityText = 'High';
                break;
            default:
                priorityClass = 'priority-medium';
                priorityText = 'Medium';
        }

        // Check if due date is approaching or past
        let dueDateClass = '';
        let dueDateText = '';

        if (todo.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dueDate = new Date(todo.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                dueDateClass = 'due-date-warning';
                dueDateText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
            } else if (diffDays === 0) {
                dueDateClass = 'due-date-warning';
                dueDateText = 'Due today';
            } else if (diffDays <= 2) {
                dueDateClass = 'due-date-warning';
                dueDateText = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
            } else {
                dueDateText = `Due in ${diffDays} days`;
            }
        }

        col.innerHTML = `
            <div class="card h-100 position-relative ${cardClass}" data-id="${todo.id}">
                <div class="card-actions">
                    <button class="action-button edit" title="Edit task">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-button toggle" title="${todo.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                        <i class="bi ${todo.completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg'}"></i>
                    </button>
                    <button class="action-button delete" title="Delete task">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${todo.title}</h5>
                    <p class="card-text">${todo.description || '<em>No description</em>'}</p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="todo-category">${todo.category || 'Uncategorized'}</span>
                        <small class="text-muted">
                            <span class="priority-indicator ${priorityClass}"></span>
                            ${priorityText} priority
                        </small>
                    </div>
                    ${todo.dueDate ? `<div class="due-date ${dueDateClass}"><i class="bi bi-calendar"></i> ${dueDateText}</div>` : ''}
                </div>
            </div>
        `;

        // Add event listeners
        const card = col.querySelector('.card');

        card.querySelector('.action-button.edit').addEventListener('click', function() {
            openEditModal(todo);
        });

        card.querySelector('.action-button.toggle').addEventListener('click', function() {
            toggleTodoCompletion(todo.id);
        });

        card.querySelector('.action-button.delete').addEventListener('click', function() {
            confirmDelete(todo.id);
        });

        // Allow clicking on the card to edit
        card.addEventListener('click', function(e) {
            // Only open edit modal if we didn't click an action button
            if (!e.target.closest('.action-button')) {
                openEditModal(todo);
            }
        });

        return col;
    }

    function renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'col-12 todo-empty';

        let message = '';

        if (currentFilter === 'all' && !currentCategory) {
            message = `
                <i class="bi bi-clipboard"></i>
                <h4>No tasks yet</h4>
                <p>Add a new task by clicking the "Add Task" button</p>
            `;
        } else if (currentFilter === 'completed') {
            message = `
                <i class="bi bi-check2-circle"></i>
                <h4>No completed tasks</h4>
                <p>Tasks you complete will appear here</p>
            `;
        } else if (currentFilter === 'pending') {
            message = `
                <i class="bi bi-hourglass"></i>
                <h4>No pending tasks</h4>
                <p>You've completed all your tasks!</p>
            `;
        } else if (currentCategory) {
            message = `
                <i class="bi bi-tag"></i>
                <h4>No tasks in "${currentCategory}"</h4>
                <p>Add a task with this category to see it here</p>
            `;
        }

        emptyDiv.innerHTML = message;
        todoList.appendChild(emptyDiv);
    }

    async function saveTodo() {
        const title = document.getElementById('todo-title').value.trim();
        const description = document.getElementById('todo-description').value.trim();
        const category = document.getElementById('todo-category').value.trim();
        const priority = document.getElementById('todo-priority').value;
        const dueDate = document.getElementById('todo-due-date').value;

        if (!title) {
            alert('Title is required');
            return;
        }

        const todo = {
            title,
            description,
            category,
            priority: parseInt(priority),
            dueDate,
            completed: false
        };

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todo)
            });

            if (!response.ok) {
                throw new Error('Failed to create todo');
            }

            const savedTodo = await response.json();

            // Update local storage
            const todos = getTodosFromLocalStorage();
            todos.push(savedTodo);
            saveTodosToLocalStorage(todos);

            // Reset form and close modal
            todoForm.reset();
            addTaskModal.hide();

            // Update UI
            renderTodos();
            updateCategoryFilters();

        } catch (error) {
            console.error('Error saving todo:', error);
            alert('Failed to save task. Please try again.');
        }
    }

    async function updateTodo() {
        const id = document.getElementById('edit-todo-id').value;
        const title = document.getElementById('edit-todo-title').value.trim();
        const description = document.getElementById('edit-todo-description').value.trim();
        const category = document.getElementById('edit-todo-category').value.trim();
        const priority = document.getElementById('edit-todo-priority').value;
        const dueDate = document.getElementById('edit-todo-due-date').value;
        const completed = document.getElementById('edit-todo-completed').checked;

        if (!title) {
            alert('Title is required');
            return;
        }

        const todoRequest = {
            title,
            description,
            category,
            priority: parseInt(priority),
            dueDate,
            completed
        };

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoRequest)
            });

            if (!response.ok) {
                throw new Error('Failed to update todo');
            }

            const savedTodo = await response.json();

            // Update local storage
            updateTodoInLocalStorage(savedTodo);

            // Close modal
            editTaskModal.hide();

            // Update UI
            renderTodos();
            updateCategoryFilters();
            
            // Show success message
            showSuccessToast('Task updated successfully');

        } catch (error) {
            console.error('Error updating todo:', error);
            showErrorToast('Failed to update task. Please try again.');
        }
    }

    async function deleteTodo() {
        const id = document.getElementById('edit-todo-id').value;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete todo');
            }

            // Update local storage
            removeTodoFromLocalStorage(id);

            // Close modal
            editTaskModal.hide();

            // Update UI
            renderTodos();
            updateCategoryFilters();

        } catch (error) {
            console.error('Error deleting todo:', error);
            alert('Failed to delete task. Please try again.');
        }
    }

    async function toggleTodoCompletion(id) {
        try {
            const response = await fetch(`/api/todos/${id}/toggle`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to toggle todo completion');
            }

            const updatedTodo = await response.json();

            // Update local storage
            updateTodoInLocalStorage(updatedTodo);

            // Update UI
            renderTodos();

        } catch (error) {
            console.error('Error toggling todo completion:', error);
            alert('Failed to update task. Please try again.');
        }
    }

    function confirmDelete(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            const todoToDelete = getTodoById(id);
            if (todoToDelete) {
                // Update for modal
                document.getElementById('edit-todo-id').value = id;
                deleteTodo();
            }
        }
    }

    function openEditModal(todo) {
        // Set form values
        document.getElementById('edit-todo-id').value = todo.id;
        document.getElementById('edit-todo-title').value = todo.title;
        document.getElementById('edit-todo-description').value = todo.description || '';
        document.getElementById('edit-todo-category').value = todo.category || '';
        document.getElementById('edit-todo-priority').value = todo.priority || 2;
        document.getElementById('edit-todo-due-date').value = todo.dueDate || '';
        document.getElementById('edit-todo-completed').checked = todo.completed;

        // Show modal
        editTaskModal.show();
    }

    function updateCategoryFilters() {
        const todos = getTodosFromLocalStorage();

        // Get unique categories
        const categories = [...new Set(todos.map(todo => todo.category).filter(Boolean))];

        // Sort alphabetically
        categories.sort();

        // Update category list
        categoryList.innerHTML = '';

        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'nav-item';

            const link = document.createElement('a');
            link.className = 'nav-link';
            link.href = '#';
            link.innerHTML = `<i class="bi bi-tag"></i> ${category}`;

            if (category === currentCategory) {
                link.classList.add('active');
            }

            link.addEventListener('click', function(e) {
                e.preventDefault();
                setActiveNav(this);
                currentCategory = category;
                currentFilter = 'all';
                currentViewTitle.textContent = `${category}`;
                renderTodos();
            });

            li.appendChild(link);
            categoryList.appendChild(li);
        });
    }

    function setActiveNav(element) {
        // Remove active class from all nav links
        document.querySelectorAll('.sidebar .nav-link').forEach(el => {
            el.classList.remove('active');
        });

        // Add active class to current element
        element.classList.add('active');
    }

    // Local storage functions
    function getTodosFromLocalStorage() {
        const storedTodos = localStorage.getItem('todos');
        return storedTodos ? JSON.parse(storedTodos) : [];
    }

    function saveTodosToLocalStorage(todos) {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function getTodoById(id) {
        const todos = getTodosFromLocalStorage();
        return todos.find(todo => todo.id === id);
    }

    function updateTodoInLocalStorage(updatedTodo) {
        const todos = getTodosFromLocalStorage();
        const index = todos.findIndex(todo => todo.id === updatedTodo.id);

        if (index !== -1) {
            todos[index] = updatedTodo;
            saveTodosToLocalStorage(todos);
        }
    }

    function removeTodoFromLocalStorage(id) {
        const todos = getTodosFromLocalStorage();
        const filteredTodos = todos.filter(todo => todo.id !== id);
        saveTodosToLocalStorage(filteredTodos);
    }
});