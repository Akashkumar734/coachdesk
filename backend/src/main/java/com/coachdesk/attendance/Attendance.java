package com.coachdesk.attendance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false, updatable = false)
    private Long teacherId;

    @Column(name = "student_id", nullable = false, updatable = false)
    private Long studentId;

    @Column(name = "att_date", nullable = false, updatable = false)
    private LocalDate date;

    @Column(nullable = false)
    private boolean present;

    protected Attendance() {
    }

    public Attendance(Long teacherId, Long studentId, LocalDate date, boolean present) {
        this.teacherId = teacherId;
        this.studentId = studentId;
        this.date = date;
        this.present = present;
    }

    public Long getId() { return id; }
    public Long getTeacherId() { return teacherId; }
    public Long getStudentId() { return studentId; }
    public LocalDate getDate() { return date; }
    public boolean isPresent() { return present; }
    public void setPresent(boolean present) { this.present = present; }
}
