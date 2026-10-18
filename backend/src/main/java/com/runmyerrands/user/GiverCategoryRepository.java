package com.runmyerrands.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GiverCategoryRepository extends JpaRepository<GiverCategory, Long> {
    List<GiverCategory> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
