package com.flopay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FloPayBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FloPayBackendApplication.class, args);
    }
}
