package com.coachdesk.fee;

import com.coachdesk.batch.Batch;
import com.coachdesk.fee.FeeDtos.FeeRow;
import com.coachdesk.fee.FeeDtos.MonthSummary;
import com.coachdesk.fee.FeeDtos.PaymentRequest;
import com.coachdesk.fee.FeeDtos.PaymentResponse;
import com.coachdesk.fee.FeeDtos.Status;
import com.coachdesk.common.NotFoundException;
import com.coachdesk.student.Student;
import com.coachdesk.student.StudentRepository;
import com.coachdesk.student.StudentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FeeService {

    private final FeePaymentRepository payments;
    private final StudentRepository students;
    private final StudentService studentService;

    public FeeService(FeePaymentRepository payments, StudentRepository students, StudentService studentService) {
        this.payments = payments;
        this.students = students;
        this.studentService = studentService;
    }

    /**
     * Fee status of every active student for one month.
     * A student is charged for a month only if they joined on or before the last day of that month.
     */
    @Transactional(readOnly = true)
    public MonthSummary monthSummary(Long teacherId, YearMonth month, Long batchId) {
        Map<Long, Batch> batchMap = studentService.batchMap(teacherId);
        Map<Long, BigDecimal> paidByStudent = payments.findByTeacherIdAndFeeMonth(teacherId, month.toString())
                .stream()
                .collect(Collectors.groupingBy(FeePayment::getStudentId,
                        Collectors.reducing(BigDecimal.ZERO, FeePayment::getAmount, BigDecimal::add)));
        LocalDate monthEnd = month.atEndOfMonth();

        List<FeeRow> rows = students.findByTeacherIdAndActiveTrueOrderByNameAsc(teacherId).stream()
                .filter(s -> batchId == null || batchId.equals(s.getBatchId()))
                .filter(s -> !s.getJoinDate().isAfter(monthEnd))
                .map(s -> toRow(s, batchMap, paidByStudent.getOrDefault(s.getId(), BigDecimal.ZERO)))
                .sorted(Comparator.comparing(FeeRow::due).reversed().thenComparing(FeeRow::studentName))
                .toList();

        BigDecimal expected = rows.stream().map(FeeRow::fee).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal collected = rows.stream().map(FeeRow::paid).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pending = rows.stream().map(FeeRow::due).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new MonthSummary(month.toString(), expected, collected, pending, rows);
    }

    @Transactional
    public PaymentResponse record(Long teacherId, PaymentRequest req) {
        studentService.get(teacherId, req.studentId()); // ownership check
        FeePayment p = new FeePayment();
        p.setTeacherId(teacherId);
        p.setStudentId(req.studentId());
        p.setFeeMonth(req.month());
        p.setAmount(req.amount());
        p.setPaidOn(req.paidOn() != null ? req.paidOn() : LocalDate.now());
        p.setMode(req.mode());
        p.setNote(req.note() == null || req.note().isBlank() ? null : req.note().trim());
        return PaymentResponse.from(payments.save(p));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> history(Long teacherId, Long studentId) {
        studentService.get(teacherId, studentId);
        return payments.findByTeacherIdAndStudentIdOrderByPaidOnDescIdDesc(teacherId, studentId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional
    public void delete(Long teacherId, Long paymentId) {
        FeePayment p = payments.findByIdAndTeacherId(paymentId, teacherId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        payments.delete(p);
    }

    private static FeeRow toRow(Student s, Map<Long, Batch> batchMap, BigDecimal paid) {
        BigDecimal fee = StudentService.effectiveFee(s, batchMap);
        BigDecimal due = fee.subtract(paid).max(BigDecimal.ZERO);
        Status status;
        if (fee.signum() == 0) {
            status = Status.NO_FEE;
        } else if (due.signum() == 0) {
            status = Status.PAID;
        } else if (paid.signum() > 0) {
            status = Status.PARTIAL;
        } else {
            status = Status.UNPAID;
        }
        Batch b = s.getBatchId() == null ? null : batchMap.get(s.getBatchId());
        return new FeeRow(s.getId(), s.getName(), s.getBatchId(), b == null ? null : b.getName(),
                s.getParentPhone() != null ? s.getParentPhone() : s.getPhone(), fee, paid, due, status);
    }
}
