# Use Maven + Java 17
FROM maven:3.9.9-eclipse-temurin-17

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build the application
RUN mvn clean package -DskipTests

# Expose port (Render requirement)
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/cafebrew-0.0.1-SNAPSHOT.jar"]
