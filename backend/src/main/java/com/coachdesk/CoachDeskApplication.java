package com.coachdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class CoachDeskApplication {

    public static void main(String[] args) {
        // "Today" for attendance and fees should follow the tutor's timezone, not the server's (UTC).
        String zone = System.getenv().getOrDefault("APP_TIMEZONE", "Asia/Kolkata");
        TimeZone.setDefault(TimeZone.getTimeZone(zone));
        SpringApplication.run(CoachDeskApplication.class, args);
    }
}
