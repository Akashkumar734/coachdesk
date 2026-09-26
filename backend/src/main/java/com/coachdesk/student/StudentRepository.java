package com.coachdesk.student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByTeacherIdOrderByNameAsc(Long teacherId);

    List<Student> findByTeacherIdAndActiveTrueOrderByNameAsc(Long teacherId);

    List<Student> findByTeacherIdAndBatchIdAndActiveTrueOrderByNameAsc(Long teacherId, Long batchId);

    Optional<Student> findByIdAndTeacherId(Long id, Long teacherId);

    long countByTeacherIdAndActiveTrue(Long teacherId);

    long countByTeacherIdAndBatchIdAndActiveTrue(Long teacherId, Long batchId);

    @Query("""
            select s.batchId, count(s) from Student s
            where s.teacherId = :teacherId and s.active = true and s.batchId is not null
            group by s.batchId
            """)
    List<Object[]> countActiveByBatchRaw(@Param("teacherId") Long teacherId);

    /** batchId -> number of active students */
    default Map<Long, Long> countActiveByBatch(Long teacherId) {
        return countActiveByBatchRaw(teacherId).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }
}
