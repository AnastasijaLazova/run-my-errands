package com.runmyerrands;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RunMyErrandsApplication {
    public static void main(String[] args) {
        SpringApplication.run(RunMyErrandsApplication.class, args);
    }
}
