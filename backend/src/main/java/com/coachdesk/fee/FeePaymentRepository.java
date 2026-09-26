package com.coachdesk.fee;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {

    List<FeePayment> findByTeacherIdAndFeeMonth(Long teacherId, String feeMonth);

    List<FeePayment> findByTeacherIdAndStudentIdOrderByPaidOnDescIdDesc(Long teacherId, Long studentId);

    Optional<FeePayment> findByIdAndTeacherId(Long id, Long teacherId);
}
