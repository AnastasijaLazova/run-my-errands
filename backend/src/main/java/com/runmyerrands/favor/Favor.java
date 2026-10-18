package com.runmyerrands.favor;

import com.runmyerrands.category.Category;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "favors")
@Getter @Setter @NoArgsConstructor
public class Favor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String title;
    private String description;

    @Column(nullable = false)
    private String neighbourhood = "";

    @Enumerated(EnumType.STRING)
    @Column(name = "when_type", nullable = false)
    private WhenType whenType = WhenType.ASAP;

    @Column(name = "when_at")
    private Instant whenAt;

    private BigDecimal budget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility = Visibility.OPEN_BOARD;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum WhenType { ASAP, SCHEDULED }
    public enum Status { OPEN, BOOKED, CLOSED, CANCELLED }
    public enum Visibility { OPEN_BOARD, DIRECT }
}
