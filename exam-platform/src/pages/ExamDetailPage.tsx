import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { Clock, HelpCircle, AlertTriangle, ShieldAlert, Play, Loader2, ArrowLeft, CheckCircle2, ChevronRight, XCircle, Sparkles, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

// ─── Simple Status Modal ──────────────────────────────────────────────────────
const StatusModal: React.FC<{ msg: string; onClose: () => void }> = ({ msg, onClose }) => {
  useModalOverlayEffects(true, { onEscape: onClose });
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#08060d]/60 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div className="relative bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl p-8 w-full max-w-sm text-center border border-[var(--border)]">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="font-black text-[var(--text-h)] text-xl mb-2">Xatolik</h3>
        <p className="text-sm text-[var(--text)] mb-8 font-medium">{msg}</p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer w-full py-4 bg-[var(--text-h)] text-[var(--bg)] rounded-2xl font-black text-sm transition-transform active:scale-95 uppercase tracking-widest"
        >
          Tushundim
        </button>
      </div>
    </div>,
    document.body
  );
};

const ExamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startExam } = useExamStore();
  const [exam, setExam] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/exams/${id}`);
        setExam(data);
      } catch { setExam(null); }
      setLoadingExam(false);
    };
    if (id) load();
  }, [id]);

  const handleStart = async () => {
    if (!id) return;
    setStarting(true);
    try {
      await startExam(id);
      navigate(`/exam-session/${id}`);
    } catch (e: any) {
      setStarting(false);
      setShowConfirm(false);
      setErrorModal(e.response?.data?.message || 'Imtihonni boshlashda xatolik');
    }
  };

  if (loadingExam) return (
    <div className="page-container flex flex-col items-center justify-center py-24">
      <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
      <p className="mt-4 text-[var(--text)] font-bold uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
    </div>
  );

  if (!exam) return (
    <div className="page-container text-center py-20">
      <p className="text-[var(--text)] font-black uppercase tracking-widest text-sm">Imtihon topilmadi</p>
      <button type="button" onClick={() => navigate('/exams')} className="cursor-pointer btn-secondary mt-6">Orqaga</button>
    </div>
  );

  const durationMin = Number(exam.duration ?? exam.duration_minutes) || 0;
  const qCount = Number(exam.questions_count ?? exam.questions?.length) || 0;

  const rules = [
    { icon: Clock, text: `Davomiyligi: ${durationMin} daqiqa` },
    { icon: HelpCircle, text: `${qCount} ta savol` },
    {
      icon: ShieldAlert,
      text: 'Boshqa tab yoki dasturga o‘tish har safar ogohlantirish: jami 3 imkoniyat. Har birida ogohlantirish ko‘rsatiladi.',
    },
    { icon: AlertTriangle, text: 'Faqat 1 marta topshirish mumkin. Topshirilgach qayta topshirib bo‘lmaydi.' },
    { icon: CheckCircle2, text: 'Vaqt tugaganda javoblar avtomatik topshiriladi.' },
    {
      icon: Ban,
      text: '3-chi ogohlantirishdan keyin qoida buzilgan hisoblanasiz: imtihon yakunlanadi va siz chetlashtirilasiz.',
    },
    {
      icon: Sparkles,
      text: 'Topshirilgach javoblar AI yordamida tekshiriladi, ball hisoblanadi; keyin natija va sharh (review) sahifalaridan ko‘rasiz.',
    },
  ];

  return (
    <div className="page-container max-w-2xl mx-auto space-y-8 pb-32 lg:pb-12">
      <button type="button" onClick={() => navigate('/exams')} className="cursor-pointer flex items-center gap-2 text-sm font-black text-[var(--text)] hover:text-[var(--accent)] transition-all uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#7d1fc7] via-[#9329e6] to-[#aa3bff] rounded-[2.5rem] p-10 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-4 py-2 bg-white/15 backdrop-blur-md text-white border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest">Imtihon</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">{exam.title}</h1>
          <div className="flex items-center gap-6 text-white/70">
            <span className="flex items-center gap-2 text-sm font-bold"><Clock className="w-4 h-4" />{durationMin} daqiqa</span>
            <span className="flex items-center gap-2 text-sm font-bold"><HelpCircle className="w-4 h-4" />{qCount} savol</span>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {exam.description && (
        <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)]">
          <p className="text-sm text-[var(--text)] leading-relaxed font-medium">{exam.description}</p>
        </div>
      )}

      {/* Rules */}
      <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
        <div className="p-6 border-b border-[var(--divide)]">
          <h2 className="font-black text-[var(--text-h)] text-xl tracking-tight flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[var(--accent)]" /> Qoidalar
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {rules.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl row-hover transition-colors">
              <div className="w-10 h-10 bg-[var(--bg-muted)] rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[var(--text)]" />
              </div>
              <p className="text-sm text-[var(--text-h)] font-semibold pt-2">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-500/5 border-2 border-amber-500/15 rounded-[2rem] p-6 flex items-start gap-5">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-h)] pt-2 leading-relaxed">
          Imtihon boshlangach boshqa tab/oynaga o‘tish yoki fokusni yo‘qotish har safar ogohlantirish beradi (jami 3 imkoniyat).
          3-chi marta imtihon qoidalari buzilgan deb yopiladi va siz chetlashtirilasiz. Vaqt tugasa — avtomatik topshiriladi.
        </p>
      </div>

      {/* Start button */}
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="cursor-pointer w-full py-5 bg-[var(--accent)] hover:brightness-110 text-white rounded-[2rem] font-black text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-[var(--accent)]/20 uppercase tracking-widest"
        >
          <Play className="w-6 h-6" /> Imtihonni boshlash
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border-2 border-[var(--accent)]/30 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center">
              <Play className="w-7 h-7 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="font-black text-[var(--text-h)] text-xl tracking-tight">Tayyormisiz?</h3>
              <p className="text-[10px] text-[var(--text)] font-black uppercase tracking-widest mt-1">Qaytarib bo'lmaydi</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text)] font-medium leading-relaxed">
            Boshlagach imtihonni bekor qilib bo‘lmaydi. Vaqt avtomatik hisoblanadi; javoblar AI va tizim orqali baholanadi.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="cursor-pointer flex-1 py-4 rounded-2xl border border-[var(--border)] text-[var(--text)] font-black text-sm hover:bg-[var(--hover-bg)] transition-colors uppercase tracking-widest"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="cursor-pointer flex-1 py-4 rounded-2xl bg-[var(--accent)] text-white font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-[var(--accent)]/20 uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Boshlash <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </motion.div>
      )}

      {errorModal && <StatusModal msg={errorModal} onClose={() => setErrorModal('')} />}
    </div>
  );
};

export default ExamDetailPage;
