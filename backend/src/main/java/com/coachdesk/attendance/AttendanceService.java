package com.coachdesk.attendance;

import com.coachdesk.attendance.AttendanceDtos.AttendanceRow;
import com.coachdesk.attendance.AttendanceDtos.DayAttendance;
import com.coachdesk.attendance.AttendanceDtos.Entry;
import com.coachdesk.attendance.AttendanceDtos.MarkRequest;
import com.coachdesk.attendance.AttendanceDtos.StudentDay;
import com.coachdesk.attendance.AttendanceDtos.StudentMonth;
import com.coachdesk.batch.BatchService;
import com.coachdesk.common.BadRequestException;
import com.coachdesk.student.Student;
import com.coachdesk.student.StudentRepository;
import com.coachdesk.student.StudentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendance;
    private final StudentRepository students;
    private final StudentService studentService;
    private final BatchService batchService;

    public AttendanceService(AttendanceRepository attendance, StudentRepository students,
                             StudentService studentService, BatchService batchService) {
        this.attendance = attendance;
        this.students = students;
        this.studentService = studentService;
        this.batchService = batchService;
    }

    @Transactional(readOnly = true)
    public DayAttendance forBatchDay(Long teacherId, Long batchId, LocalDate date) {
        batchService.get(teacherId, batchId); // ownership check
        List<Student> list = students.findByTeacherIdAndBatchIdAndActiveTrueOrderByNameAsc(teacherId, batchId);
        if (list.isEmpty()) {
            return new DayAttendance(batchId, date, List.of());
        }
        Map<Long, Boolean> marked = attendance
                .findByTeacherIdAndDateAndStudentIdIn(teacherId, date, list.stream().map(Student::getId).toList())
                .stream()
                .collect(Collectors.toMap(Attendance::getStudentId, Attendance::isPresent));
        List<AttendanceRow> rows = list.stream()
                .map(s -> new AttendanceRow(s.getId(), s.getName(), marked.get(s.getId())))
                .toList();
        return new DayAttendance(batchId, date, rows);
    }

    /** Saves (inserts or updates) attendance for many students on one day. */
    @Transactional
    public void mark(Long teacherId, MarkRequest req) {
        if (req.date().isAfter(LocalDate.now().plusDays(1))) {
            throw new BadRequestException("You cannot mark attendance for a future date");
        }
        Set<Long> ids = req.entries().stream().map(Entry::studentId).collect(Collectors.toSet());
        long owned = students.findAllById(ids).stream()
                .filter(s -> s.getTeacherId().equals(teacherId))
                .count();
        if (owned != ids.size()) {
            throw new BadRequestException("One or more students were not found");
        }
        Map<Long, Attendance> existing = attendance
                .findByTeacherIdAndDateAndStudentIdIn(teacherId, req.date(), ids).stream()
                .collect(Collectors.toMap(Attendance::getStudentId, Function.identity()));
        for (Entry e : req.entries()) {
            Attendance a = existing.get(e.studentId());
            if (a == null) {
                // remember it so a repeated studentId in the same request updates instead of inserting twice
                existing.put(e.studentId(), attendance.save(new Attendance(teacherId, e.studentId(), req.date(), e.present())));
            } else {
                a.setPresent(e.present());
            }
        }
    }

    @Transactional(readOnly = true)
    public StudentMonth studentMonth(Long teacherId, Long studentId, YearMonth month) {
        studentService.get(teacherId, studentId); // ownership check
        List<StudentDay> days = attendance
                .findByTeacherIdAndStudentIdAndDateBetweenOrderByDateAsc(
                        teacherId, studentId, month.atDay(1), month.atEndOfMonth())
                .stream()
                .map(a -> new StudentDay(a.getDate(), a.isPresent()))
                .toList();
        int present = (int) days.stream().filter(StudentDay::present).count();
        int absent = days.size() - present;
        int pct = days.isEmpty() ? 0 : Math.round(present * 100f / days.size());
        return new StudentMonth(studentId, month.toString(), present, absent, pct, days);
    }
}
