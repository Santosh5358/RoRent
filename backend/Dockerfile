# syntax=docker/dockerfile:1

# ---- Build stage: compile the Spring Boot jar with JDK 17 ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Cache dependencies first for faster rebuilds
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---- Run stage: small JRE image ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Cloud hosts inject $PORT; the app reads it (falls back to 8081 locally).
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
