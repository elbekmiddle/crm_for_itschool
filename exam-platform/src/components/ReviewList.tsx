import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ExamResultDetail } from '../types';

interface ReviewListProps {
  details: ExamResultDetail[];
}

const ReviewList: React.FC<ReviewListProps> = ({ details }) => {
  return (
    <div className="space-y-4">
      {details.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            "card p-6 border-l-4",
            item.is_correct ? "border-l-green-500" : "border-l-red-500"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm",
                item.is_correct ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              )}
            >
              {idx + 1}
            </div>
            <div className="flex-1 space-y-4">
              <h4 className="font-bold text-slate-800 leading-relaxed">{item.question_text}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Student answer */}
                <div className={cn(
                  "p-4 rounded-xl border",
                  item.is_correct
                    ? "bg-green-50/50 border-green-100"
                    : "bg-red-50/50 border-red-100"
                )}>
                  <div className="label-subtle mb-1.5 flex items-center gap-1.5">
                    {item.is_correct ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                    Sizning javob
                  </div>
                  <div className={cn(
                    "font-bold text-sm",
                    item.is_correct ? "text-green-700" : "text-red-600"
                  )}>
                    {item.student_answer || "Javob berilmagan"}
                  </div>
                </div>

                {/* Correct answer (only if wrong and server exposes key — talabaga kalit yashirilganda ko‘rinmaydi) */}
                {!item.is_correct && item.correct_answer != null && item.correct_answer !== '' && (
                  <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="label-subtle mb-1.5 flex items-center gap-1.5 text-green-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri javob
                    </div>
                    <div className="font-bold text-sm text-green-700">{item.correct_answer}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {details.length === 0 && (
        <p className="text-center text-slate-400 font-medium py-8">Tahlil topilmadi</p>
      )}
    </div>
  );
};

export default ReviewList;
