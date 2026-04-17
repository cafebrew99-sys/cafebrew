# Use Maven + Java 17 image
FROM maven:3.9.9-eclipse-temurin-17

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build jar
RUN mvn clean package -DskipTests

# Expose port
EXPOSE 8080

# Run app
CMD ["java", "-jar", "target/cafebrew-0.0.1-SNAPSHOT.jar"]
