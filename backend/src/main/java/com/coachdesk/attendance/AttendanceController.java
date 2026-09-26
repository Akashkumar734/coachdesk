package com.coachdesk.attendance;

import com.coachdesk.attendance.AttendanceDtos.DayAttendance;
import com.coachdesk.attendance.AttendanceDtos.MarkRequest;
import com.coachdesk.attendance.AttendanceDtos.StudentMonth;
import com.coachdesk.auth.CurrentTeacher;
import com.coachdesk.common.Months;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService service;
    private final CurrentTeacher current;

    public AttendanceController(AttendanceService service, CurrentTeacher current) {
        this.service = service;
        this.current = current;
    }

    /** GET /api/attendance?batchId=1&date=2026-09-26 */
    @GetMapping
    public DayAttendance forDay(@RequestParam Long batchId,
                                @RequestParam(required = false)
                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.forBatchDay(current.id(), batchId, date != null ? date : LocalDate.now());
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void mark(@Valid @RequestBody MarkRequest request) {
        service.mark(current.id(), request);
    }

    /** GET /api/attendance/student/5?month=2026-09 */
    @GetMapping("/student/{studentId}")
    public StudentMonth studentMonth(@PathVariable Long studentId,
                                     @RequestParam(required = false) String month) {
        return service.studentMonth(current.id(), studentId, Months.parseOrCurrent(month));
    }
}
