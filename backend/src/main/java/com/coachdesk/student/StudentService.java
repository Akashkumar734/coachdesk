package com.coachdesk.student;

import com.coachdesk.batch.Batch;
import com.coachdesk.batch.BatchRepository;
import com.coachdesk.common.NotFoundException;
import com.coachdesk.student.StudentDtos.StudentRequest;
import com.coachdesk.student.StudentDtos.StudentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository students;
    private final BatchRepository batches;

    public StudentService(StudentRepository students, BatchRepository batches) {
        this.students = students;
        this.batches = batches;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> list(Long teacherId, Long batchId, String query, boolean includeInactive) {
        Map<Long, Batch> batchMap = batchMap(teacherId);
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return students.findByTeacherIdOrderByNameAsc(teacherId).stream()
                .filter(s -> includeInactive || s.isActive())
                .filter(s -> batchId == null || batchId.equals(s.getBatchId()))
                .filter(s -> q.isEmpty()
                        || s.getName().toLowerCase(Locale.ROOT).contains(q)
                        || (s.getPhone() != null && s.getPhone().contains(q))
                        || (s.getParentPhone() != null && s.getParentPhone().contains(q)))
                .map(s -> toResponse(s, batchMap))
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse getOne(Long teacherId, Long id) {
        return toResponse(get(teacherId, id), batchMap(teacherId));
    }

    @Transactional
    public StudentResponse create(Long teacherId, StudentRequest req) {
        Student s = new Student();
        s.setTeacherId(teacherId);
        apply(teacherId, s, req);
        students.save(s);
        return toResponse(s, batchMap(teacherId));
    }

    @Transactional
    public StudentResponse update(Long teacherId, Long id, StudentRequest req) {
        Student s = get(teacherId, id);
        apply(teacherId, s, req);
        return toResponse(s, batchMap(teacherId));
    }

    @Transactional
    public void delete(Long teacherId, Long id) {
        students.delete(get(teacherId, id));
    }

    public Student get(Long teacherId, Long id) {
        return students.findByIdAndTeacherId(id, teacherId)
                .orElseThrow(() -> new NotFoundException("Student not found"));
    }

    public Map<Long, Batch> batchMap(Long teacherId) {
        return batches.findByTeacherIdOrderByNameAsc(teacherId).stream()
                .collect(Collectors.toMap(Batch::getId, Function.identity()));
    }

    /** Personal fee wins; otherwise the batch fee; otherwise zero. */
    public static BigDecimal effectiveFee(Student s, Map<Long, Batch> batchMap) {
        if (s.getMonthlyFee() != null) {
            return s.getMonthlyFee();
        }
        Batch b = s.getBatchId() == null ? null : batchMap.get(s.getBatchId());
        return b == null ? BigDecimal.ZERO : b.getMonthlyFee();
    }

    private void apply(Long teacherId, Student s, StudentRequest req) {
        if (req.batchId() != null) {
            // make sure the batch belongs to this teacher
            batches.findByIdAndTeacherId(req.batchId(), teacherId)
                    .orElseThrow(() -> new NotFoundException("Batch not found"));
        }
        s.setName(req.name().trim());
        s.setPhone(trimToNull(req.phone()));
        s.setParentName(trimToNull(req.parentName()));
        s.setParentPhone(trimToNull(req.parentPhone()));
        s.setBatchId(req.batchId());
        s.setJoinDate(req.joinDate() != null ? req.joinDate()
                : (s.getJoinDate() != null ? s.getJoinDate() : LocalDate.now()));
        s.setMonthlyFee(req.monthlyFee());
        if (req.active() != null) {
            s.setActive(req.active());
        }
        s.setNotes(trimToNull(req.notes()));
    }

    private static StudentResponse toResponse(Student s, Map<Long, Batch> batchMap) {
        Batch b = s.getBatchId() == null ? null : batchMap.get(s.getBatchId());
        return new StudentResponse(s.getId(), s.getName(), s.getPhone(), s.getParentName(), s.getParentPhone(),
                s.getBatchId(), b == null ? null : b.getName(), s.getJoinDate(),
                s.getMonthlyFee(), effectiveFee(s, batchMap), s.isActive(), s.getNotes());
    }

    private static String trimToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
