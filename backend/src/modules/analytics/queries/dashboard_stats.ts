import { Logger } from '@nestjs/common';
import { DbService } from '../../../infrastructure/database/db.service';

const logger = new Logger('dashboard_stats');

/** Agar biror KPI so‘rovi yiqilsa ham API 500 bermasligi uchun minimal javob. */
function emptyDashboardFallback() {
  return {
    totalStudents: 0,
    totalCourses: 0,
    totalGroups: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    pendingAmount: 0,
    frozenAccounts: 0,
    topCourses: [] as unknown[],
    attendanceAvg: 0,
    growthTrend: [] as { month: string; count: number }[],
    growthTrendWeek: [] as { month: string; count: number }[],
    growthTrendYearly: [] as { year: string; count: number }[],
    revenueMonthOverMonthPct: 0,
    debtorStudentCount: 0,
    overdue60DayStudentCount: 0,
    topStudents: [] as unknown[],
    collectionRate: 100,
  };
}

export async function dashboard_stats(dbService: DbService) {
  try {
    return await computeDashboardStats(dbService);
  } catch (e) {
    logger.error(e instanceof Error ? e.message : String(e));
    return emptyDashboardFallback();
  }
}

async function computeDashboardStats(dbService: DbService) {
  const [
    students, courses, groups, revenue, pendingPayments, 
    topCourses, attendance, growth, topStudents, 
    frozenAccounts, pendingAmount,
    growthYearly,
    revenueMom,
    debtorStudents,
    overdue60d,
    growthWeek,
  ] = await Promise.all([
    dbService.querySafe(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`, [], [{ count: '0' }]),
    dbService.querySafe(`SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL`, [], [{ count: '0' }]),
    dbService.querySafe(`SELECT COUNT(*) FROM groups WHERE deleted_at IS NULL`, [], [{ count: '0' }]),
    dbService.querySafe(`SELECT SUM(amount) as total FROM payments`, [], [{ total: '0' }]),
    dbService.querySafe(`SELECT COUNT(*) FROM payments WHERE status = 'pending'`, [], [{ count: '0' }]),
    dbService.querySafe(`
      SELECT c.name, COUNT(sc.student_id) as student_count
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id AND sc.status = 'active'
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY student_count DESC
      LIMIT 5
    `, [], []),
    dbService.querySafe(`
      SELECT ROUND(AVG(CASE WHEN status = 'PRESENT' THEN 100 ELSE 0 END), 1) as avg
      FROM attendance
      WHERE lesson_date > NOW() - INTERVAL '30 days'
    `, [], [{ avg: '0' }]),
    // Growth Trend (last 6 months)
    dbService.querySafe(`
      SELECT 
        TRIM(TO_CHAR(date_trunc('month', created_at), 'Mon')) as month,
        COUNT(*) as count
      FROM students
      WHERE created_at > NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    `, [], []),
    // Top Students
    dbService.querySafe(`
      SELECT 
        s.id, s.first_name, s.last_name,
        COALESCE(s.email, u.email) as email,
        COALESCE(ROUND(AVG(er.score)), 0) as avg_score,
        COALESCE((SELECT ROUND(AVG(CASE WHEN status = 'PRESENT' THEN 100 ELSE 0 END)) FROM attendance WHERE student_id = s.id), 0) as attendance_pct
      FROM students s
      LEFT JOIN users u ON u.id = s.id
      LEFT JOIN exam_results er ON s.id = er.student_id
      WHERE s.deleted_at IS NULL
      GROUP BY s.id, s.first_name, s.last_name, s.email, u.email
      ORDER BY avg_score DESC, attendance_pct DESC
      LIMIT 10
    `, [], []),
    // Extra metrics for Payments page
    dbService.querySafe(`SELECT COUNT(*) FROM students WHERE status = 'frozen' AND deleted_at IS NULL`, [], [{ count: '0' }]),
    dbService.querySafe(`SELECT SUM(amount) as total FROM payments WHERE status = 'pending'`, [], [{ total: '0' }]),
    dbService.querySafe(
      `
      SELECT TRIM(TO_CHAR(date_trunc('year', created_at), 'YYYY')) AS year, COUNT(*)::text AS count
      FROM students
      WHERE created_at > NOW() - INTERVAL '5 years'
      GROUP BY date_trunc('year', created_at)
      ORDER BY date_trunc('year', created_at)
      `,
      [],
      [],
    ),
    dbService.querySafe(
      `
      SELECT
        COALESCE(SUM(CASE WHEN paid_at >= date_trunc('month', CURRENT_TIMESTAMP) THEN amount ELSE 0 END), 0) AS cur_m,
        COALESCE(SUM(CASE WHEN paid_at >= date_trunc('month', CURRENT_TIMESTAMP - INTERVAL '1 month')
          AND paid_at < date_trunc('month', CURRENT_TIMESTAMP) THEN amount ELSE 0 END), 0) AS prev_m
      FROM payments
      `,
      [],
      [{ cur_m: '0', prev_m: '0' }],
    ),
    dbService.querySafe(
      `
      WITH last_pay AS (
        SELECT student_id, MAX(paid_at) AS last_paid FROM payments GROUP BY student_id
      )
      SELECT COUNT(*)::text AS c FROM students s
      LEFT JOIN last_pay lp ON lp.student_id = s.id
      WHERE s.deleted_at IS NULL
        AND (lp.last_paid IS NULL OR lp.last_paid < NOW() - INTERVAL '60 days')
      `,
      [],
      [{ c: '0' }],
    ),
    dbService.querySafe(
      `
      WITH last_pay AS (
        SELECT student_id, MAX(paid_at) AS last_paid FROM payments GROUP BY student_id
      )
      SELECT COUNT(*)::text AS c FROM students s
      JOIN last_pay lp ON lp.student_id = s.id
      WHERE s.deleted_at IS NULL
        AND lp.last_paid < NOW() - INTERVAL '60 days'
      `,
      [],
      [{ c: '0' }],
    ),
    dbService.querySafe(
      `
      SELECT
        TRIM(TO_CHAR(d::date, 'DD.MM')) AS month,
        COUNT(s.id)::text AS count
      FROM generate_series(
        (CURRENT_DATE - INTERVAL '6 days')::date,
        CURRENT_DATE::date,
        INTERVAL '1 day'
      ) AS d
      LEFT JOIN students s
        ON s.deleted_at IS NULL
        AND s.created_at::date = d::date
      GROUP BY d
      ORDER BY d
      `,
      [],
      [],
    ),
  ]);

  const totalRev = Number(revenue?.[0]?.total) || 0;
  const pendingRevAmount = Number(pendingAmount?.[0]?.total) || 0;
  const collectionRate = totalRev > 0 ? Math.round((totalRev / (totalRev + pendingRevAmount)) * 1000) / 10 : 100;

  const curM = Number(revenueMom?.[0]?.cur_m) || 0;
  const prevM = Number(revenueMom?.[0]?.prev_m) || 0;
  const revenueMomPct =
    prevM > 0 ? Math.round(((curM - prevM) / prevM) * 1000) / 10 : curM > 0 ? 100 : 0;

  return {
    totalStudents: parseInt(students?.[0]?.count ?? '0', 10),
    totalCourses: parseInt(courses?.[0]?.count ?? '0', 10),
    totalGroups: parseInt(groups?.[0]?.count ?? '0', 10),
    totalRevenue: totalRev,
    pendingPayments: parseInt(pendingPayments?.[0]?.count ?? '0', 10),
    pendingAmount: pendingRevAmount,
    frozenAccounts: parseInt(frozenAccounts?.[0]?.count ?? '0', 10),
    topCourses: topCourses,
    attendanceAvg: Number(attendance?.[0]?.avg) || 0,
    growthTrend: growth.map((g: any) => ({ month: g.month, count: parseInt(g.count, 10) })),
    growthTrendWeek: (growthWeek || []).map((g: any) => ({
      month: g.month,
      count: parseInt(g.count, 10) || 0,
    })),
    growthTrendYearly: (growthYearly || []).map((g: any) => ({
      year: g.year,
      count: parseInt(g.count, 10) || 0,
    })),
    revenueMonthOverMonthPct: revenueMomPct,
    debtorStudentCount: parseInt(debtorStudents?.[0]?.c ?? '0', 10),
    overdue60DayStudentCount: parseInt(overdue60d?.[0]?.c ?? '0', 10),
    topStudents: topStudents,
    collectionRate: collectionRate
  };
}
