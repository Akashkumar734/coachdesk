package com.coachdesk.batch;

import com.coachdesk.batch.BatchDtos.BatchRequest;
import com.coachdesk.batch.BatchDtos.BatchResponse;
import com.coachdesk.common.NotFoundException;
import com.coachdesk.student.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class BatchService {

    private final BatchRepository batches;
    private final StudentRepository students;

    public BatchService(BatchRepository batches, StudentRepository students) {
        this.batches = batches;
        this.students = students;
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> list(Long teacherId) {
        Map<Long, Long> counts = students.countActiveByBatch(teacherId);
        return batches.findByTeacherIdOrderByNameAsc(teacherId).stream()
                .map(b -> toResponse(b, counts.getOrDefault(b.getId(), 0L)))
                .toList();
    }

    @Transactional
    public BatchResponse create(Long teacherId, BatchRequest req) {
        Batch b = new Batch();
        b.setTeacherId(teacherId);
        apply(b, req);
        batches.save(b);
        return toResponse(b, 0);
    }

    @Transactional
    public BatchResponse update(Long teacherId, Long id, BatchRequest req) {
        Batch b = get(teacherId, id);
        apply(b, req);
        return toResponse(b, students.countByTeacherIdAndBatchIdAndActiveTrue(teacherId, id));
    }

    /** Deleting a batch keeps its students; they just have no batch (ON DELETE SET NULL). */
    @Transactional
    public void delete(Long teacherId, Long id) {
        batches.delete(get(teacherId, id));
    }

    public Batch get(Long teacherId, Long id) {
        return batches.findByIdAndTeacherId(id, teacherId)
                .orElseThrow(() -> new NotFoundException("Batch not found"));
    }

    private static void apply(Batch b, BatchRequest req) {
        b.setName(req.name().trim());
        b.setSubject(trimToNull(req.subject()));
        b.setTiming(trimToNull(req.timing()));
        b.setMonthlyFee(req.monthlyFee());
        if (req.active() != null) {
            b.setActive(req.active());
        }
    }

    private static BatchResponse toResponse(Batch b, long studentCount) {
        return new BatchResponse(b.getId(), b.getName(), b.getSubject(), b.getTiming(),
                b.getMonthlyFee(), b.isActive(), studentCount);
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
