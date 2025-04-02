 package com.example.todo_app.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import jakarta.annotation.PostConstruct;


@Configuration
public class DynamoDBConfig {
    private final DynamoDbClient dynamoDbClient;

    public DynamoDBConfig() {
        this.dynamoDbClient = DynamoDbClient.builder()
                .region(Region.EU_CENTRAL_1) // Adjust as needed
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Bean
    public DynamoDbClient dynamoDbClient() {
        return dynamoDbClient;
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient client) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(client)
                .build();
    }

    @PostConstruct
    public void init() {
        String tableName = "todos";
        try {
            // Check if table exists
            dynamoDbClient.describeTable(DescribeTableRequest.builder().tableName(tableName).build());
        } catch (ResourceNotFoundException e) {
            // Create table if it doesn't exist
            createTable(tableName);
        }
    }

    private void createTable(String tableName) {
        CreateTableRequest request = CreateTableRequest.builder()
                .tableName(tableName)
                .attributeDefinitions(
                        AttributeDefinition.builder()
                                .attributeName("id")
                                .attributeType(ScalarAttributeType.S)
                                .build()
                )
                .keySchema(
                        KeySchemaElement.builder()
                                .attributeName("id")
                                .keyType(KeyType.HASH)
                                .build()
                )
                .provisionedThroughput(
                        ProvisionedThroughput.builder()
                                .readCapacityUnits(5L)
                                .writeCapacityUnits(5L)
                                .build()
                )
                .build();

        try {
            dynamoDbClient.createTable(request);
            // Wait for table to be active
            dynamoDbClient.waiter().waitUntilTableExists(
                    DescribeTableRequest.builder().tableName(tableName).build()
            );
            System.out.println("Table 'todos' created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create table 'todos'", e);
        }
    }
}