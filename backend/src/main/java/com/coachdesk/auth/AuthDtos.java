package com.coachdesk.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required") @Size(max = 100) String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 150) String email,
            @NotBlank(message = "Password is required") @Size(min = 8, max = 72, message = "Password must be 8-72 characters") String password,
            @Size(max = 150) String instituteName,
            @Size(max = 20) String phone) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password) {
    }

    public record TeacherResponse(Long id, String name, String email, String instituteName, String phone) {
        static TeacherResponse from(Teacher t) {
            return new TeacherResponse(t.getId(), t.getName(), t.getEmail(), t.getInstituteName(), t.getPhone());
        }
    }

    public record AuthResponse(String token, TeacherResponse teacher) {
    }
}
