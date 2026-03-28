import { DbService } from '../../../infrastructure/database/db.service';

export async function create_course(dbService: DbService, data: any) {
  const { name, price } = data;
  const result = await dbService.query(
    `INSERT INTO courses (name, price) VALUES ($1, $2) RETURNING *`,
    [name, price]
  );
  return result[0];
}
