package com.coachdesk.student;

import com.coachdesk.auth.CurrentTeacher;
import com.coachdesk.student.StudentDtos.StudentRequest;
import com.coachdesk.student.StudentDtos.StudentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;
    private final CurrentTeacher current;

    public StudentController(StudentService service, CurrentTeacher current) {
        this.service = service;
        this.current = current;
    }

    @GetMapping
    public List<StudentResponse> list(@RequestParam(required = false) Long batchId,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(defaultValue = "false") boolean includeInactive) {
        return service.list(current.id(), batchId, q, includeInactive);
    }

    @GetMapping("/{id}")
    public StudentResponse get(@PathVariable Long id) {
        return service.getOne(current.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody StudentRequest request) {
        return service.create(current.id(), request);
    }

    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return service.update(current.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(current.id(), id);
    }
}
