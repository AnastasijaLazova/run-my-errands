package com.runmyerrands.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "giver_profiles")
@Getter @Setter @NoArgsConstructor
public class GiverProfile {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String bio;

    private String availability;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(name = "rating_avg", nullable = false)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    private Integer ratingCount = 0;

    @Column(name = "completed_count", nullable = false)
    private Integer completedCount = 0;
}
