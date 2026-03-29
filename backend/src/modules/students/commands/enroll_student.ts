import { DbService } from '../../../infrastructure/database/db.service';
import { BadRequestException } from '@nestjs/common';

export async function enroll_student(dbService: DbService, studentId: string, courseId: string) {
  // Check if student already has active course
  const activeCourses = await dbService.query(
    `SELECT * FROM student_courses WHERE student_id = $1 AND status = 'active'`,
    [studentId]
  );

  if (activeCourses.length > 0) {
    if (activeCourses[0].course_id === courseId) {
      return { success: true, message: 'Student already enrolled in this course' };
    }
    throw new BadRequestException('Student already has an active course. Close the old course before enrolling in a new one.');
  }

  const result = await dbService.query(
    `INSERT INTO student_courses (student_id, course_id, status) VALUES ($1, $2, 'active') RETURNING *`,
    [studentId, courseId]
  );
  
  return { success: true, enrollment: result[0] };
}
