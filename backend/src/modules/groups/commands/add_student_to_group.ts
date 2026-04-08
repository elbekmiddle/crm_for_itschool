import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { enroll_student } from '../../students/commands/enroll_student';

export async function add_student_to_group(dbService: DbService, groupId: string, studentId: string) {
  // 1. Get group info (course and capacity)
  const groupData = await dbService.query(
    `SELECT g.course_id, g.capacity, 
     (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id AND (gs.left_at IS NULL)) as current_count
     FROM groups g WHERE g.id = $1`,
    [groupId],
  );
  if (!groupData.length) throw new NotFoundException('Group not found');
  const { course_id, capacity, current_count } = groupData[0];
  const capNum =
    capacity == null || capacity === '' || Number.isNaN(Number(capacity))
      ? 9999
      : Number(capacity);

  // 2. Prevent over-capacity groups
  if (Number(current_count) >= capNum) {
    throw new BadRequestException(`Guruh to‘ldi (${capNum} o‘rin). Yana qo‘shib bo‘lmaydi.`);
  }

  // 3. Ensure student is enrolled in the group's course (auto-enroll if none)
  let enrollment = await dbService.querySafe(
    `SELECT * FROM student_courses WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
    [studentId, course_id],
    [],
  );
  if (enrollment.length === 0) {
    const anyActive = await dbService.querySafe(
      `SELECT course_id FROM student_courses WHERE student_id = $1 AND status = 'active' LIMIT 1`,
      [studentId],
      [],
    );
    if (anyActive.length > 0) {
      throw new BadRequestException(
        'Talaba boshqa kursga biriktirilgan. Avvalo kursni almashtiring yoki shu kursga yozing.',
      );
    }
    await enroll_student(dbService, studentId, course_id);
    enrollment = await dbService.querySafe(
      `SELECT * FROM student_courses WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
      [studentId, course_id],
      [],
    );
    if (enrollment.length === 0) {
      throw new BadRequestException('Talabani kursga yozib bo‘lmadi.');
    }
  }

  // 4. Rule: A student can be in ONLY ONE active group at a time (left_at — tark etganlar hisobga olinmaydi)
  const activeGroups = await dbService.query(
    `SELECT gs.group_id, g.name 
     FROM group_students gs 
     JOIN groups g ON gs.group_id = g.id 
     WHERE gs.student_id = $1 AND (gs.left_at IS NULL)`,
    [studentId],
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
