import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export async function add_student_to_group(dbService: DbService, groupId: string, studentId: string) {
  // 1. Get group info (course and capacity)
  const groupData = await dbService.query(
    `SELECT g.course_id, g.capacity, 
     (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as current_count
     FROM groups g WHERE g.id = $1`, [groupId]
  );
  if (!groupData.length) throw new NotFoundException('Group not found');
  const { course_id, capacity, current_count } = groupData[0];

  // 2. Prevent over-capacity groups
  if (current_count >= capacity) {
    throw new BadRequestException(`Group capacity reached (${capacity}). Cannot add more students.`);
  }

  // 3. Ensure student is enrolled in the group's course (if student_courses exists)
  const enrollment = await dbService.querySafe(
    `SELECT * FROM student_courses WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
    [studentId, course_id],
    [],
  );
  if (enrollment.length === 0) {
    throw new BadRequestException('Talaba ushbu guruh kursiga biriktirilmagan.');
  }

  // 4. Rule: A student can be in ONLY ONE active group at a time
  const activeGroups = await dbService.query(
    `SELECT gs.group_id, g.name 
     FROM group_students gs 
     JOIN groups g ON gs.group_id = g.id 
     WHERE gs.student_id = $1`,
    [studentId]
  );

  if (activeGroups.length > 0) {
    throw new ConflictException(`Student is already in group: ${activeGroups[0].name}. Leave the old group first.`);
  }

  try {
    const result = await dbService.query(
      `INSERT INTO group_students (group_id, student_id) VALUES ($1, $2) RETURNING *`,
      [groupId, studentId]
    );
    return result[0];
  } catch (error) {
     throw new ConflictException('Failed to add student to group.');
  }
}
