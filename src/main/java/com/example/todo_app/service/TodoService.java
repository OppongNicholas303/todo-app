 package com.example.todo_app.service;
import com.example.todo_app.model.Todo;
import com.example.todo_app.repository.TodoRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class TodoService {
    private final TodoRepository repository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public TodoService(TodoRepository repository) {
        this.repository = repository;
    }

    public List<Todo> getAllTodos() {
        return repository.findAll();
    }

    public Todo createTodo(Todo todo) {
        todo.setId(UUID.randomUUID().toString());
        String now = LocalDateTime.now().format(FORMATTER);
        todo.setCreatedAt(now);
        todo.setUpdatedAt(now);
        todo.setPriority(todo.getPriority() != null ? todo.getPriority().toLowerCase() : "medium");
        todo.setCompleted(false);
        return repository.save(todo);
    }

    public Todo toggleTodo(String id) {
        Todo todo = repository.findById(id);
        if (todo != null) {
            todo.setCompleted(!todo.isCompleted());
            todo.setUpdatedAt(LocalDateTime.now().format(FORMATTER));
            return repository.save(todo);
        }
        return null;
    }

    public boolean deleteTodo(String id) {
        Todo todo = repository.findById(id);
        if (todo != null) {
            repository.delete(id);
            return true;
        }
        return false;
    }
}