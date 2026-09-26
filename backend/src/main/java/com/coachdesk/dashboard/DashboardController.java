package com.coachdesk.dashboard;

import com.coachdesk.attendance.Attendance;
import com.coachdesk.attendance.AttendanceRepository;
import com.coachdesk.auth.CurrentTeacher;
import com.coachdesk.batch.BatchRepository;
import com.coachdesk.fee.FeeDtos.FeeRow;
import com.coachdesk.fee.FeeDtos.MonthSummary;
import com.coachdesk.fee.FeeService;
import com.coachdesk.student.StudentRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    public record Dashboard(long activeStudents, long activeBatches, String month,
                            BigDecimal feesExpected, BigDecimal feesCollected, BigDecimal feesPending,
                            int todayMarked, int todayPresent, List<FeeRow> topDues) {
    }

    private final StudentRepository students;
    private final BatchRepository batches;
    private final AttendanceRepository attendance;
    private final FeeService feeService;
    private final CurrentTeacher current;

    public DashboardController(StudentRepository students, BatchRepository batches,
                               AttendanceRepository attendance, FeeService feeService, CurrentTeacher current) {
        this.students = students;
        this.batches = batches;
        this.attendance = attendance;
        this.feeService = feeService;
        this.current = current;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Dashboard get() {
        Long teacherId = current.id();
        YearMonth month = YearMonth.now();
        MonthSummary fees = feeService.monthSummary(teacherId, month, null);
        List<Attendance> today = attendance.findByTeacherIdAndDate(teacherId, LocalDate.now());
        int present = (int) today.stream().filter(Attendance::isPresent).count();
        List<FeeRow> topDues = fees.rows().stream()
                .filter(r -> r.due().signum() > 0)
                .limit(5)
                .toList();
        return new Dashboard(
                students.countByTeacherIdAndActiveTrue(teacherId),
                batches.countByTeacherIdAndActiveTrue(teacherId),
                month.toString(),
                fees.expected(), fees.collected(), fees.pending(),
                today.size(), present, topDues);
    }
}
