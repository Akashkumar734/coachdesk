package com.coachdesk.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByTeacherIdAndDateAndStudentIdIn(Long teacherId, LocalDate date, Collection<Long> studentIds);

    List<Attendance> findByTeacherIdAndStudentIdAndDateBetweenOrderByDateAsc(
            Long teacherId, Long studentId, LocalDate from, LocalDate to);

    List<Attendance> findByTeacherIdAndDate(Long teacherId, LocalDate date);
}
