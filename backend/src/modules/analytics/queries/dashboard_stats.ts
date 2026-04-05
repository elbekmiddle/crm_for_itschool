import { DbService } from '../../../infrastructure/database/db.service';

export async function dashboard_stats(dbService: DbService) {
  const [
    students, courses, groups, revenue, pendingPayments, 
    topCourses, attendance, growth, topStudents, 
    frozenAccounts, pendingAmount
  ] = await Promise.all([
    dbService.query(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`),
    dbService.query(`SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL`),
    dbService.query(`SELECT COUNT(*) FROM groups WHERE deleted_at IS NULL`),
    dbService.query(`SELECT SUM(amount) as total FROM payments`),
    dbService.query(`SELECT COUNT(*) FROM payments WHERE status = 'pending'`),
    dbService.query(`
      SELECT c.name, COUNT(sc.student_id) as student_count
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id AND sc.status = 'active'
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY student_count DESC
      LIMIT 5
    `),
    dbService.query(`
      SELECT ROUND(AVG(CASE WHEN status = 'PRESENT' THEN 100 ELSE 0 END), 1) as avg
      FROM attendance
      WHERE lesson_date > NOW() - INTERVAL '30 days'
    `),
    // Growth Trend (last 6 months)
    dbService.query(`
      SELECT 
        TRIM(TO_CHAR(date_trunc('month', created_at), 'Mon')) as month,
        COUNT(*) as count
      FROM students
      WHERE created_at > NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    `),
    // Top Students
    dbService.query(`
      SELECT 
        s.id, s.first_name, s.last_name, s.email,
        COALESCE(ROUND(AVG(er.score)), 0) as avg_score,
        COALESCE((SELECT ROUND(AVG(CASE WHEN status = 'PRESENT' THEN 100 ELSE 0 END)) FROM attendance WHERE student_id = s.id), 0) as attendance_pct
      FROM students s
      LEFT JOIN exam_results er ON s.id = er.student_id
      WHERE s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY avg_score DESC, attendance_pct DESC
      LIMIT 10
    `),
    // Extra metrics for Payments page
    dbService.query(`SELECT COUNT(*) FROM students WHERE status = 'frozen' AND deleted_at IS NULL`),
    dbService.query(`SELECT SUM(amount) as total FROM payments WHERE status = 'pending'`)
  ]);

  const totalRev = Number(revenue[0].total) || 0;
  const pendingRevAmount = Number(pendingAmount[0].total) || 0;
  const collectionRate = totalRev > 0 ? Math.round((totalRev / (totalRev + pendingRevAmount)) * 1000) / 10 : 100;

  return {
    totalStudents: parseInt(students[0].count, 10),
    totalCourses: parseInt(courses[0].count, 10),
    totalGroups: parseInt(groups[0].count, 10),
    totalRevenue: totalRev,
    pendingPayments: parseInt(pendingPayments[0].count, 10),
    pendingAmount: pendingRevAmount,
    frozenAccounts: parseInt(frozenAccounts[0].count, 10),
    topCourses: topCourses,
    attendanceAvg: Number(attendance[0].avg) || 0,
    growthTrend: growth.map((g: any) => ({ month: g.month, count: parseInt(g.count, 10) })),
    topStudents: topStudents,
    collectionRate: collectionRate
  };
}
