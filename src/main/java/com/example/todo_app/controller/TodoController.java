 package com.example.todo_app.controller;
import com.example.todo_app.model.Todo;
import com.example.todo_app.service.TodoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Controller
@CrossOrigin(origins = "*")
public class TodoController {
    private final TodoService service;

    public TodoController(TodoService service) {
        this.service = service;
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/api/todos")
    @ResponseBody
    public List<Todo> getAllTodos() {
        return service.getAllTodos();
    }

    @PostMapping("/api/todos")
    @ResponseBody
    public ResponseEntity<Todo> createTodo(@RequestBody Todo todo) {
        Todo created = service.createTodo(todo);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/api/todos/{id}/toggle")
    @ResponseBody
    public ResponseEntity<Todo> toggleTodo(@PathVariable String id) {
        Todo updated = service.toggleTodo(id);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/api/todos/{id}")
    @ResponseBody
    public ResponseEntity<Void> deleteTodo(@PathVariable String id) {
        return service.deleteTodo(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}