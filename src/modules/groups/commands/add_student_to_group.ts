import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

export async function add_student_to_group(dbService: DbService, groupId: string, studentId: string) {
  // Pre-check for constraint: 1 student = 1 group per course
  const groupCheck = await dbService.query(
    `SELECT g.course_id FROM groups g WHERE g.id = $1`, [groupId]
  );
  if (!groupCheck.length) throw new NotFoundException('Group not found');
  const courseId = groupCheck[0].course_id;

  const conflictingGroups = await dbService.query(
    `SELECT gs.group_id 
     FROM group_students gs 
     JOIN groups g ON gs.group_id = g.id 
     WHERE gs.student_id = $1 AND g.course_id = $2`,
    [studentId, courseId]
  );

  if (conflictingGroups.length > 0) {
    throw new ConflictException('Student is already in another group for this course');
  }

  try {
    const result = await dbService.query(
      `INSERT INTO group_students (group_id, student_id) VALUES ($1, $2) RETURNING *`,
      [groupId, studentId]
    );
    return result[0];
  } catch (error) {
     throw new ConflictException('Student possibly already linked or missing foreign key.');
  }
}
