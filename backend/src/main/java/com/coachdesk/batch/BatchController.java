package com.coachdesk.batch;

import com.coachdesk.auth.CurrentTeacher;
import com.coachdesk.batch.BatchDtos.BatchRequest;
import com.coachdesk.batch.BatchDtos.BatchResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService service;
    private final CurrentTeacher current;

    public BatchController(BatchService service, CurrentTeacher current) {
        this.service = service;
        this.current = current;
    }

    @GetMapping
    public List<BatchResponse> list() {
        return service.list(current.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BatchResponse create(@Valid @RequestBody BatchRequest request) {
        return service.create(current.id(), request);
    }

    @PutMapping("/{id}")
    public BatchResponse update(@PathVariable Long id, @Valid @RequestBody BatchRequest request) {
        return service.update(current.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(current.id(), id);
    }
}
