package com.runmyerrands.favor;

import com.runmyerrands.favor.dto.GiverMatchDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Givers who do the favor's category at roughly the requester's price. No distance filtering —
 * Skopje is small, so each giver's neighbourhood is shown and the requester decides.
 */
@Repository
@RequiredArgsConstructor
public class MatchingRepository {

    private final JdbcTemplate jdbc;

    public List<GiverMatchDto> findMatches(Long categoryId, Long requesterId, BigDecimal targetPrice,
                                          double priceTolerancePct, String sort) {
        StringBuilder sql = new StringBuilder("""
            SELECT u.id AS user_id, u.display_name, u.avatar_url, u.neighbourhood,
                   gc.price, gp.rating_avg, gp.rating_count, gp.verified
            FROM giver_categories gc
            JOIN giver_profiles gp ON gp.user_id = gc.user_id
            JOIN users u ON u.id = gp.user_id
            WHERE gc.category_id = ? AND u.id <> ?
            """);
        List<Object> params = new ArrayList<>(List.of(categoryId, requesterId));

        if (targetPrice != null) {
            sql.append(" AND gc.price BETWEEN ? AND ? ");
            params.add(BigDecimal.valueOf(targetPrice.doubleValue() * (1 - priceTolerancePct)));
            params.add(BigDecimal.valueOf(targetPrice.doubleValue() * (1 + priceTolerancePct)));
        }

        String orderBy = "price".equals(sort) ? "gc.price ASC" : "gp.rating_avg DESC, gp.rating_count DESC";
        sql.append(" ORDER BY ").append(orderBy).append(" LIMIT 50");

        return jdbc.query(sql.toString(), (rs, i) -> new GiverMatchDto(
                rs.getLong("user_id"), rs.getString("display_name"), rs.getString("avatar_url"),
                rs.getString("neighbourhood"), rs.getBigDecimal("price"), rs.getDouble("rating_avg"),
                rs.getInt("rating_count"), rs.getBoolean("verified")), params.toArray());
    }
}
