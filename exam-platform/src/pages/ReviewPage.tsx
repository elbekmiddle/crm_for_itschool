import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, BookOpen } from 'lucide-react';
import api from '../lib/api';
import { displayQuestionTextUz } from '../lib/questionText';
import { stableOptionId } from '../lib/utils';

const unwrapCell = (raw: unknown) => {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

/** CRM 0-based indeks vs talaba 1-based id — backend bilan bir xil mantiq */
function optionIsCorrectMcq(
  correctRaw: unknown,
  oi: number,
  optId: unknown,
  optText?: unknown,
): boolean {
  const ca = unwrapCell(correctRaw);
  const oid = String(optId ?? '');
  const txt = String(optText ?? '').trim();

  if (Array.isArray(ca)) {
    const set = new Set(ca.map((x) => String(x).trim()));
    if (oid && set.has(oid)) return true;
    if (set.has(String(oi + 1)) || set.has(String(oi))) return true;
    return false;
  }

  if (txt !== '' && (String(ca ?? '').trim() === txt || String(ca) === txt)) return true;
  if (String(ca ?? '').trim() === oid && oid !== '') return true;

  const rawNum =
    typeof ca === 'number'
      ? ca
      : typeof ca === 'string' && ca.trim() !== ''
        ? Number(ca)
        : NaN;
  if (Number.isFinite(rawNum) && Number.isInteger(rawNum) && rawNum >= 0 && rawNum <= 40) {
    if (oi === rawNum) return true;
    if (oid === String(rawNum + 1)) return true;
  }
  return String(ca ?? '') === String(oi + 1);
}

const normalizeOptions = (opts: unknown): Array<{ id?: string; text?: string; value?: string }> => {
  if (opts == null) return [];
  let o: any = opts;
  if (typeof o === 'string') {
    try {
      o = JSON.parse(o);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(o)) return [];
  return o.map((x: any, i: number) =>
    typeof x === 'object' && x !== null
      ? { ...x, id: stableOptionId(x.id ?? x.value, i) }
      : { id: String(i + 1), text: String(x) },
  );
};

const ReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { questions, answers, attemptId } = useExamStore();
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const aid = searchParams.get('attempt') || attemptId || undefined;
      try {
        if (aid) {
          const { data } = await api.get(`/exams/review/${encodeURIComponent(aid)}`);
          const det = data?.details;
          if (Array.isArray(det) && det.length) {
            const rows = det.map((d: any) => {
              const opts = normalizeOptions(d.question_options ?? d.options);
              return {
                id: d.question_id || d.id,
                text: d.question_text,
                question_text: d.question_text,
                options: opts.length ? opts : undefined,
                student_answer: unwrapCell(d.answer ?? d.answer_payload),
                is_correct: d.is_correct,
                correct_answer: unwrapCell(d.correct_answer),
                question_type: d.question_type,
                earned_points: d.points_earned,
              };
            });
            setReviewData(rows);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* */
      }
      if (questions?.length) {
        setReviewData(
          questions.map((q: any) => ({
            ...q,
            student_answer: answers?.[q.id],
            is_correct: null,
            correct_answer: null,
          })),
        );
      }
      setLoading(false);
    };
    load();
  }, [id, attemptId, searchParams, questions, answers]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  const correct = reviewData.filter((q) => q.is_correct).length;
  const total = reviewData.length;

  return (
    <div className="page-container mx-auto space-y-6 pb-20 lg:pb-6 animate-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const aid = searchParams.get('attempt');
            navigate(aid ? `/exams/${id}/result?attempt=${encodeURIComponent(aid)}` : `/exams/${id}/result`);
          }}
          className="cursor-pointer w-9 h-9 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-[var(--border)] rounded-xl flex items-center justify-center hover:border-primary-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Javoblarni ko&apos;rish</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {correct} / {total} to&apos;g&apos;ri javob
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
            Ochiq va murakkab javoblar AI yordamida tekshirilgan bo&apos;lishi mumkin; yakuniy ball natija sahifasida
            ko&apos;rinadi.
          </p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-black text-slate-700 whitespace-nowrap">
          {total > 0 ? Math.round((correct / total) * 100) : 0}%
        </span>
      </div>

      {reviewData.length > 0 ? (
        <div className="space-y-10">
          {reviewData.map((q: any, i: number) => {
            const isCorrect = q.is_correct;
            const isAnswered = q.student_answer !== undefined && q.student_answer !== null;
            const rowKey = `q-${String(q.id ?? i)}-${i}`;
            return (
              <div
                key={rowKey}
                className={`card p-5 border-l-4 ${
                  isCorrect === true
                    ? 'border-l-green-400'
                    : isCorrect === false
                      ? 'border-l-red-400'
                      : 'border-l-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5 shrink-0">#{i + 1}</span>
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                      {displayQuestionTextUz(q.text || q.question)}
                    </p>
                  </div>
                  {isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  {isCorrect === false && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </div>

                {q.options && Array.isArray(q.options) && (
                  <div className="space-y-2">
                    {q.options.map((opt: any, oi: number) => {
                      const optVal = typeof opt === 'object' ? opt.text || opt.value : opt;
                      const optId = typeof opt === 'object' ? opt.id ?? opt.value : opt;
                      const sa = q.student_answer;
                      const isStudentAnswer = (() => {
                        if (Array.isArray(sa)) {
                          const ids = sa.map((x) => String(x));
                          return ids.includes(String(optId ?? '')) || ids.includes(String(oi + 1));
                        }
                        return (
                          String(sa ?? '') === String(optId ?? '') || String(sa ?? '') === String(oi + 1)
                        );
                      })();
                      const caUnwrapped = unwrapCell(q.correct_answer);
                      const hasReveal =
                        caUnwrapped != null && caUnwrapped !== '' && !(Array.isArray(caUnwrapped) && caUnwrapped.length === 0);
                      const isCorrectOpt = hasReveal && optionIsCorrectMcq(q.correct_answer, oi, optId, optVal);
                      let rowTone: 'green' | 'red' | 'neutral';
                      if (hasReveal) {
                        if (isCorrectOpt) rowTone = 'green';
                        else if (isStudentAnswer) rowTone = 'red';
                        else rowTone = 'neutral';
                      } else if (isCorrect === true && isStudentAnswer) {
                        rowTone = 'green';
                      } else if (isCorrect === false && isStudentAnswer) {
                        rowTone = 'red';
                      } else {
                        rowTone = 'neutral';
                      }
                      const optKey = `${rowKey}-opt-${oi}-${String(optId ?? oi)}`;
                      return (
                        <div
                          key={optKey}
                          className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-between ${
                            rowTone === 'green'
                              ? 'bg-green-400/10 border-green-400 text-green-700 dark:text-green-400'
                              : rowTone === 'red'
                                ? 'bg-red-50 border-red-200 text-red-700 dark:text-red-400'
                                : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                                rowTone === 'green' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'
                              }`}
                            >
                              {rowTone === 'green' ? '✓' : oi + 1}
                            </div>
                            {optVal}
                          </div>
                          {isStudentAnswer && rowTone === 'red' && (
                            <span className="text-[10px] font-black uppercase text-red-500 bg-red-100 px-2 py-1 rounded-lg">
                              Sizning javobingiz
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!q.options && isAnswered && (
                  <div className="space-y-3">
                    <div
                      className={`p-5 rounded-2xl border-2 ${
                        isCorrect === true ? 'bg-green-400/5 border-green-400/30' : 'bg-red-400/5 border-red-400/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            AI Tahlili
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Ball: {q.earned_points || (isCorrect ? 10 : 0)} / 10
                        </span>
                      </div>

                      {q.question_type === 'code' ? (
                        <pre className="text-xs font-mono bg-slate-900 text-indigo-300 p-4 rounded-xl overflow-x-auto">
                          {String(q.student_answer ?? '')}
                        </pre>
                      ) : (
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          &quot;{String(q.student_answer ?? '')}&quot;
                        </p>
                      )}

                      <div className="mt-4 flex items-start gap-2 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-lg">🤖</div>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                          AI: Ushbu javob savol mazmuniga{' '}
                          {isCorrect ? "to'liq mos keladi" : 'qisman mos emas'}.
                          {isCorrect
                            ? " Kalit so'zlar va mantiq to'g'ri qo'llanilgan."
                            : " Javobni yanada aniqlashtirish tavsiya etiladi."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isAnswered && (
                  <div className="p-3 rounded-xl text-sm font-medium bg-slate-50 border border-slate-100 text-slate-400">
                    Savol javobsiz qoldirildi
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 font-semibold text-sm">Ko&apos;rib chiqish ma&apos;lumotlari yo&apos;q</p>
        </div>
      )}

      <button
        onClick={() => navigate('/exams')}
        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Imtihonlarga qaytish
      </button>
    </div>
  );
};

export default ReviewPage;
