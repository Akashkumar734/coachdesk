package com.coachdesk.auth;

import com.coachdesk.auth.AuthDtos.AuthResponse;
import com.coachdesk.auth.AuthDtos.LoginRequest;
import com.coachdesk.auth.AuthDtos.RegisterRequest;
import com.coachdesk.auth.AuthDtos.TeacherResponse;
import com.coachdesk.common.BadRequestException;
import com.coachdesk.common.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final TeacherRepository teachers;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(TeacherRepository teachers, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.teachers = teachers;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (teachers.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("An account with this email already exists");
        }
        Teacher t = new Teacher();
        t.setName(req.name().trim());
        t.setEmail(email);
        t.setPasswordHash(passwordEncoder.encode(req.password()));
        t.setInstituteName(blankToNull(req.instituteName()));
        t.setPhone(blankToNull(req.phone()));
        teachers.save(t);
        return new AuthResponse(tokenService.createToken(t), TeacherResponse.from(t));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Teacher t = teachers.findByEmailIgnoreCase(req.email().trim())
                .filter(found -> passwordEncoder.matches(req.password(), found.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong email or password"));
        return new AuthResponse(tokenService.createToken(t), TeacherResponse.from(t));
    }

    @Transactional(readOnly = true)
    public TeacherResponse me(Long teacherId) {
        return teachers.findById(teacherId)
                .map(TeacherResponse::from)
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
