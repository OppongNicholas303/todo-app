 package com.example.todo_app.repository;
import com.example.todo_app.model.Todo;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class TodoRepository {
    private final DynamoDbEnhancedClient client;
    private DynamoDbTable<Todo> table;

    public TodoRepository(DynamoDbEnhancedClient client) {
        this.client = client;
    }

    @PostConstruct
    public void init() {
        table = client.table("todos", TableSchema.fromBean(Todo.class));
    }

    public List<Todo> findAll() {
        return table.scan().items().stream().collect(Collectors.toList());
    }

    public Todo findById(String id) {
        return table.getItem(Key.builder().partitionValue(id).build());
    }

    public Todo save(Todo todo) {
        table.putItem(todo);
        return todo;
    }

    public void delete(String id) {
        table.deleteItem(Key.builder().partitionValue(id).build());
    }
}