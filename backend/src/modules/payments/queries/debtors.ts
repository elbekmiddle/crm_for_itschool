import { DbService } from '../../../infrastructure/database/db.service';

/** Talabalar: to'lov yo'q yoki oxirgi to'lov 60 kundan eski (getStudentPayments bilan mos). */
export async function list_debtor_students(dbService: DbService) {
  try {
    return await dbService.querySafe(
      `
    WITH last_pay AS (
      SELECT student_id, MAX(paid_at) AS last_paid
      FROM payments
      GROUP BY student_id
    )
    SELECT
      s.id,
      s.first_name,
      s.last_name,
      s.phone,
      lp.last_paid,
      gl.group_name,
      gl.course_name,
      gl.joined_at,
      CASE
        WHEN lp.last_paid IS NULL THEN 'PENDING'
        WHEN lp.last_paid < NOW() - INTERVAL '60 days' THEN 'FROZEN'
        ELSE 'ACTIVE'
      END AS debt_status,
      CASE
        WHEN lp.last_paid IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM (NOW() - lp.last_paid))::int
      END AS days_since_payment
    FROM students s
    LEFT JOIN last_pay lp ON lp.student_id = s.id
    LEFT JOIN LATERAL (
      SELECT
        g.name AS group_name,
        c.name AS course_name,
        NULL::timestamptz AS joined_at
      FROM group_students gs
      INNER JOIN groups g ON g.id = gs.group_id AND g.deleted_at IS NULL
      LEFT JOIN courses c ON c.id = g.course_id
      WHERE gs.student_id = s.id
        AND gs.left_at IS NULL
      ORDER BY g.name ASC NULLS LAST
      LIMIT 1
    ) gl ON TRUE
    WHERE s.deleted_at IS NULL
      AND (lp.last_paid IS NULL OR lp.last_paid < NOW() - INTERVAL '60 days')
    ORDER BY lp.last_paid NULLS FIRST, s.first_name
    `,
      [],
      [],
    );
  } catch {
    return [];
  }
}
