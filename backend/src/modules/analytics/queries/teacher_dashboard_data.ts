import { DbService } from '../../../infrastructure/database/db.service';

export async function teacher_dashboard_data(dbService: DbService, teacherId: string) {
  const groups = await dbService.query(`SELECT * FROM groups WHERE teacher_id = $1`, [teacherId]);
  const groupIds = groups.map((g: any) => g.id);
  
  if (groupIds.length === 0) {
    return { groups, students: [], attendance: [], debtors: [], attendance_stats: [], exams: [] };
  }

  const [students, attendance, debtors, attendance_stats, exams] = await Promise.all([
    dbService.query(`
      SELECT DISTINCT s.* FROM students s 
      JOIN group_students gs ON s.id = gs.student_id 
      WHERE gs.group_id = ANY($1::uuid[]) AND s.deleted_at IS NULL
    `, [groupIds]),
    
    dbService.query(`
      SELECT * FROM attendance 
      WHERE group_id = ANY($1::uuid[]) AND lesson_date = CURRENT_DATE
    `, [groupIds]),
    
    dbService.query(`
      SELECT DISTINCT s.* FROM students s
      JOIN group_students gs ON s.id = gs.student_id
      LEFT JOIN (
        SELECT student_id, MAX(paid_at) as last_payment 
        FROM payments GROUP BY student_id
      ) p ON p.student_id = s.id
      WHERE gs.group_id = ANY($1::uuid[]) 
      AND (p.last_payment IS NULL OR p.last_payment < NOW() - INTERVAL '60 days')
      AND s.deleted_at IS NULL
    `, [groupIds]),

    dbService.query(`
      SELECT 
        s.id, s.first_name, s.last_name,
        COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as attended,
        COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as missed
      FROM students s
      JOIN group_students gs ON s.id = gs.student_id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.group_id = gs.group_id
      WHERE gs.group_id = ANY($1::uuid[]) AND s.deleted_at IS NULL
      GROUP BY s.id
    `, [groupIds]),

    dbService.query(`SELECT * FROM exams WHERE created_by = $1`, [teacherId])
  ]);

  return { groups, students, attendance, debtors, attendance_stats, exams };
}
