package com.runmyerrands.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter @Setter @NoArgsConstructor
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String key;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "name_mk", nullable = false)
    private String nameMk;

    @Enumerated(EnumType.STRING)
    @Column(name = "trust_tier", nullable = false)
    private TrustTier trustTier;

    public enum TrustTier { LOW, MEDIUM, HIGH }
}
