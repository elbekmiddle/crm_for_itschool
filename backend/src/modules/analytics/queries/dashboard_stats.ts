import { DbService } from '../../../infrastructure/database/db.service';

export async function dashboard_stats(dbService: DbService) {
  const studentsCount = await dbService.query(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`);
  const coursesCount = await dbService.query(`SELECT COUNT(*) FROM courses`);
  const totalRevenue = await dbService.query(`SELECT SUM(amount) as total FROM payments`);

  return {
    total_students: parseInt(studentsCount[0].count, 10),
    total_courses: parseInt(coursesCount[0].count, 10),
    total_revenue: totalRevenue[0].total || 0,
  };
}
