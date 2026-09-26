package com.coachdesk.batch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    List<Batch> findByTeacherIdOrderByNameAsc(Long teacherId);

    Optional<Batch> findByIdAndTeacherId(Long id, Long teacherId);

    long countByTeacherIdAndActiveTrue(Long teacherId);
}
