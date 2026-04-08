import { DbService } from '../../../infrastructure/database/db.service';

async function loadTeacherGroups(dbService: DbService, teacherId: string) {
  try {
    return await dbService.query(
      `SELECT g.*, c.name AS course_name,
              COALESCE(gs.cnt, 0)::int AS student_count
       FROM groups g
       LEFT JOIN courses c ON c.id = g.course_id
       LEFT JOIN (
         SELECT group_id, COUNT(*)::int AS cnt
         FROM group_students
         WHERE left_at IS NULL
         GROUP BY group_id
       ) gs ON gs.group_id = g.id
       WHERE g.teacher_id = $1 AND g.deleted_at IS NULL
       ORDER BY g.created_at DESC`,
      [teacherId],
    );
  } catch (e: any) {
    if (e?.code === '42703') {
      return dbService.querySafe(
        `SELECT g.*, c.name AS course_name,
                COALESCE(gs.cnt, 0)::int AS student_count
         FROM groups g
         LEFT JOIN courses c ON c.id = g.course_id
         LEFT JOIN (
           SELECT group_id, COUNT(*)::int AS cnt FROM group_students GROUP BY group_id
         ) gs ON gs.group_id = g.id
         WHERE g.teacher_id = $1
         ORDER BY g.created_at DESC`,
        [teacherId],
        [],
      );
    }
    throw e;
  }
}

async function loadTeacherExams(dbService: DbService, teacherId: string) {
  try {
    return await dbService.query(
      `SELECT e.id, e.title, e.created_at, c.name AS course_name,
              g.name AS group_name,
              COALESCE(
                (SELECT ROUND(AVG(er.score))::int FROM exam_results er WHERE er.exam_id = e.id),
                0
              ) AS avg_score
       FROM exams e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN groups g ON g.id = e.group_id
       WHERE e.created_by = $1
       ORDER BY e.created_at DESC
       LIMIT 12`,
      [teacherId],
    );
  } catch (e: any) {
    if (e?.code === '42703') {
      return dbService.query(
        `SELECT e.id, e.title, e.created_at, c.name AS course_name,
                NULL::text AS group_name,
                COALESCE(
                  (SELECT ROUND(AVG(er.score))::int FROM exam_results er WHERE er.exam_id = e.id),
                  0
                ) AS avg_score
         FROM exams e
         JOIN courses c ON c.id = e.course_id
         WHERE e.created_by = $1
         ORDER BY e.created_at DESC
         LIMIT 12`,
        [teacherId],
      );
    }
    return dbService.querySafe(
      `SELECT e.id, e.title, e.created_at, NULL::text AS course_name, NULL::text AS group_name, 0 AS avg_score
       FROM exams e
       WHERE e.created_by = $1
       ORDER BY e.created_at DESC
       LIMIT 12`,
      [teacherId],
      [],
    );
  }
}

export async function teacher_dashboard_data(dbService: DbService, teacherId: string) {
  const [groups, exams] = await Promise.all([
    loadTeacherGroups(dbService, teacherId),
    loadTeacherExams(dbService, teacherId),
  ]);
  const groupIds = groups.map((g: any) => g.id);

  if (groupIds.length === 0) {
    return { groups, students: [], attendance: [], debtors: [], attendance_stats: [], exams };
  }

  const [students, attendance, debtors, attendance_stats] = await Promise.all([
    dbService.query(
      `
      SELECT DISTINCT s.* FROM students s
      JOIN group_students gs ON s.id = gs.student_id
      WHERE gs.group_id = ANY($1::uuid[])
        AND (gs.left_at IS NULL)
        AND s.deleted_at IS NULL
    `,
      [groupIds],
    ),

    dbService.query(
      `
      SELECT * FROM attendance 
      WHERE group_id = ANY($1::uuid[]) AND lesson_date = CURRENT_DATE
    `,
      [groupIds],
    ),

    dbService.query(
      `
      SELECT DISTINCT s.* FROM students s
      JOIN group_students gs ON s.id = gs.student_id
      LEFT JOIN (
        SELECT student_id, MAX(paid_at) as last_payment 
        FROM payments GROUP BY student_id
      ) p ON p.student_id = s.id
      WHERE gs.group_id = ANY($1::uuid[]) 
      AND (p.last_payment IS NULL OR p.last_payment < NOW() - INTERVAL '60 days')
      AND s.deleted_at IS NULL
    `,
      [groupIds],
    ),

    dbService.query(
      `
      SELECT 
        s.id, s.first_name, s.last_name,
        COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as attended,
        COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as missed
      FROM students s
      JOIN group_students gs ON s.id = gs.student_id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.group_id = gs.group_id
      WHERE gs.group_id = ANY($1::uuid[]) AND s.deleted_at IS NULL
      GROUP BY s.id
    `,
      [groupIds],
    ),
  ]);

  return { groups, students, attendance, debtors, attendance_stats, exams };
}
