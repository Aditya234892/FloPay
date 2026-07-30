# ---- build stage -----------------------------------------------------------
# JDK 21, not a newer release: Lombok's annotation processor patches javac
# internals via Unsafe and fails on JDK 26 with
# "ExceptionInInitializerError: com.sun.tools.javac.code.TypeTag :: UNKNOWN".
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy the descriptor alone first so dependency resolution is cached and only
# re-runs when the pom actually changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- runtime stage ---------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Run unprivileged — a container process that does not need root should not have it.
RUN addgroup -S flopay && adduser -S flopay -G flopay
USER flopay

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

# MaxRAMPercentage keeps the JVM inside the container's memory limit instead of
# reading the host's total RAM, which is what causes OOM kills on small instances.
ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
