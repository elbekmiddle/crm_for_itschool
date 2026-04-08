import { BadRequestException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DbService } from '../../../infrastructure/database/db.service';

async function rows(
  dbService: DbService,
  client: PoolClient | undefined,
  text: string,
  values?: any[],
) {
  if (client) {
    const r = await client.query(text, values);
    return r.rows;
  }
  return dbService.query(text, values);
}

/** When `client` is set, all queries run on that connection (same transaction). */
export async function enroll_student(
  dbService: DbService,
  studentId: string,
  courseId: string,
  client?: PoolClient,
) {
  const activeCourses = await rows(
    dbService,
    client,
    `SELECT * FROM student_courses WHERE student_id = $1 AND status = 'active'`,
    [studentId],
  );

  if (activeCourses.length > 0) {
    if (activeCourses[0].course_id === courseId) {
      return { success: true, message: 'Student already enrolled in this course' };
    }
    throw new BadRequestException(
      'Student already has an active course. Close the old course before enrolling in a new one.',
    );
  }

  const result = await rows(
    dbService,
    client,
    `INSERT INTO student_courses (student_id, course_id, status) VALUES ($1, $2, 'active') RETURNING *`,
    [studentId, courseId],
  );

  return { success: true, enrollment: result[0] };
}
