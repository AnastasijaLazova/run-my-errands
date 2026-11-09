package com.runmyerrands.landing;

import com.runmyerrands.landing.dto.LandingDto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class LandingRepository {

    private final JdbcTemplate jdbc;

    public List<CategoryCard> categories() {
        return jdbc.query("""
            SELECT c.id, c.key, c.name_en, c.name_mk, c.trust_tier,
                   MIN(gc.price) AS from_price, COUNT(gc.id) AS giver_count
            FROM categories c
            LEFT JOIN giver_categories gc ON gc.category_id = c.id
            GROUP BY c.id ORDER BY c.id
            """, (rs, i) -> new CategoryCard(rs.getLong("id"), rs.getString("key"), rs.getString("name_en"),
                rs.getString("name_mk"), rs.getString("trust_tier"), rs.getBigDecimal("from_price"), rs.getInt("giver_count")));
    }

    public Stats stats() {
        return jdbc.queryForObject("""
            SELECT (SELECT COUNT(*) FROM categories) AS categories,
                   (SELECT COUNT(DISTINCT user_id) FROM giver_categories) AS givers,
                   (SELECT COUNT(*) FROM bookings WHERE status IN ('COMPLETED','CLOSED')) AS completed
            """, (rs, i) -> new Stats(rs.getInt("categories"), rs.getInt("givers"), rs.getInt("completed")));
    }

    /** Best-rated Givers that have at least one rating, for the match preview. */
    public List<FeaturedGiver> topGivers(int limit) {
        return jdbc.query("""
            SELECT u.display_name, u.neighbourhood, gp.rating_avg, gp.rating_count, MIN(gc.price) AS from_price
            FROM giver_profiles gp
            JOIN users u ON u.id = gp.user_id
            JOIN giver_categories gc ON gc.user_id = gp.user_id
            WHERE gp.rating_count > 0
            GROUP BY u.id, gp.user_id
            ORDER BY gp.rating_avg DESC, gp.rating_count DESC
            LIMIT ?
            """, (rs, i) -> new FeaturedGiver(shortName(rs.getString("display_name")), rs.getString("neighbourhood"),
                rs.getBigDecimal("rating_avg"), rs.getInt("rating_count"), rs.getBigDecimal("from_price")), limit);
    }

    /** Latest published, written, good reviews that requesters left for Givers. */
    public List<ReviewCard> recentReviews(int limit) {
        return jdbc.query("""
            SELECT u.display_name, r.stars, r.text, c.key, c.name_en, c.name_mk
            FROM reviews r
            JOIN bookings b ON b.id = r.booking_id AND b.requester_id = r.author_id
            JOIN favors f ON f.id = b.favor_id
            JOIN categories c ON c.id = f.category_id
            JOIN users u ON u.id = r.author_id
            WHERE r.published_at IS NOT NULL AND r.stars >= 4 AND length(trim(coalesce(r.text, ''))) >= 20
            ORDER BY r.published_at DESC
            LIMIT ?
            """, (rs, i) -> new ReviewCard(shortName(rs.getString("display_name")), rs.getShort("stars"), rs.getString("text"),
                rs.getString("key"), rs.getString("name_en"), rs.getString("name_mk")), limit);
    }

    /** "Maja Andova" → "Maja A." */
    static String shortName(String full) {
        String[] parts = full == null ? new String[0] : full.trim().split("\s+");
        if (parts.length == 0 || parts[0].isEmpty()) return "";
        return parts.length == 1 ? parts[0] : parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
    }
}
