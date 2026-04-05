import React from 'react';
import { User } from 'lucide-react';
import type { Student } from '../types';

interface StudentProfileCardProps {
  student: Student;
}

const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ student }) => {
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200/40 shrink-0">
        {student.image_url ? (
          <img
            src={student.image_url}
            alt={student.first_name}
            className="w-full h-full rounded-2xl object-cover"
          />
        ) : (
          <User className="w-8 h-8" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-black text-slate-800 truncate">
          {student.first_name} {student.last_name || ''}
        </h3>
        <p className="text-sm text-slate-400 font-medium truncate">{student.phone}</p>
        {student.parent_name && (
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Ota-ona: {student.parent_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentProfileCard;
