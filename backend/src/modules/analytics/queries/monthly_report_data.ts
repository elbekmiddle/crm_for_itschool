import { DbService } from '../../../infrastructure/database/db.service';

export async function monthly_report_data(dbService: DbService, month: number, year: number) {
  const [revenue, newStudents, attendanceStats] = await Promise.all([
    dbService.query(
      `SELECT SUM(amount) as total FROM payments 
       WHERE EXTRACT(MONTH FROM paid_at) = $1 AND EXTRACT(YEAR FROM paid_at) = $2`,
      [month, year]
    ),
    dbService.query(
      `SELECT COUNT(*) FROM students 
       WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
      [month, year]
    ),
    dbService.query(
      `SELECT status, COUNT(*) as count FROM attendance 
       WHERE EXTRACT(MONTH FROM lesson_date) = $1 AND EXTRACT(YEAR FROM lesson_date) = $2
       GROUP BY status`,
      [month, year]
    )
  ]);

  return {
    month,
    year,
    total_revenue: parseFloat(revenue[0].total) || 0,
    new_students: parseInt(newStudents[0].count, 10),
    attendance_summary: attendanceStats
  };
}
