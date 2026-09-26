package com.coachdesk.auth;

import com.coachdesk.auth.AuthDtos.AuthResponse;
import com.coachdesk.auth.AuthDtos.LoginRequest;
import com.coachdesk.auth.AuthDtos.RegisterRequest;
import com.coachdesk.auth.AuthDtos.TeacherResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentTeacher currentTeacher;

    public AuthController(AuthService authService, CurrentTeacher currentTeacher) {
        this.authService = authService;
        this.currentTeacher = currentTeacher;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public TeacherResponse me() {
        return authService.me(currentTeacher.id());
    }
}
