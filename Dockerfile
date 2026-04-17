# Use Java 17 base image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy Maven wrapper & pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (faster build)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose port (Render uses 8080 by default)
EXPOSE 8080

# Run the jar file
CMD ["java", "-jar", "target/cafebrew-0.0.1-SNAPSHOT.jar"]
