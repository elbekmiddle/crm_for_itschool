import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { Clock, HelpCircle, AlertTriangle, ShieldAlert, Play, Loader2, ArrowLeft, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import api from '../lib/api';

// ─── Simple Status Modal (instead of alert) ──────────────────────────────────
const StatusModal: React.FC<{ msg: string; onClose: () => void }> = ({ msg, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center border border-slate-100 dark:border-slate-800">
      <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="font-black text-slate-900 dark:text-white mb-2">Xatolik</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{msg}</p>
      <button onClick={onClose} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm transition-transform active:scale-95">
        Tushundim
      </button>
    </div>
  </div>
);

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

  if (loadingExam) return <div className="page-container flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;
  if (!exam) return (
    <div className="page-container text-center py-20">
      <p className="text-slate-400">Imtihon topilmadi</p>
      <button onClick={() => navigate('/exams')} className="btn-secondary mt-4">Orqaga</button>
    </div>
  );

  const rules = [
    { icon: Clock, text: `Davomiyligi: ${exam.duration} daqiqa` },
    { icon: HelpCircle, text: `${exam.questions_count} ta savol` },
    { icon: ShieldAlert, text: 'Boshqa tabga o\'tish imtihonni bekor qilishi mumkin' },
    { icon: AlertTriangle, text: 'Faqat 1 urinish. Topshirilgach qaytarib bo\'lmaydi' },
    { icon: CheckCircle2, text: 'Vaqt tugaganda avtomatik topshiriladi' },
  ];

  return (
    <div className="page-container max-w-2xl mx-auto space-y-6 pb-20 lg:pb-6 animate-in">
      <button onClick={() => navigate('/exams')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-all">
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mt-12" />
        <div className="relative z-10">
          <span className="status-pill bg-white/15 text-white border-white/20 mb-3 inline-flex">Imtihon</span>
          <h1 className="text-2xl font-black">{exam.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-primary-200 text-sm">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{exam.duration} daqiqa</span>
            <span className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4" />{exam.questions_count} savol</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {exam.description && (
        <div className="card p-5">
          <p className="text-sm text-slate-600 leading-relaxed">{exam.description}</p>
        </div>
      )}

      {/* Rules */}
      <div className="card p-5 space-y-4">
        <h2 className="font-black text-slate-900 text-base">📋 Qoidalar</h2>
        <div className="space-y-3">
          {rules.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-700 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-amber-800">
          Imtihonni boshlagandan so'ng, imtihon sahifasini tark etish ogohlantirish sifatida hisoblanadi.
          3 ta ogohlantirish — avtomatik topshirish.
        </p>
      </div>

      {/* Start button */}
      {!showConfirm ? (
        <button 
          onClick={() => setShowConfirm(true)} 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-600/20"
        >
          <Play className="w-6 h-6" /> Imtihonni boshlash
        </button>
      ) : (
        <div className="card p-6 space-y-5 border-2 border-indigo-200 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Play className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-black text-slate-900">Tayyormisiz?</h3>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Imtihonni boshlagandan so'ng uni to'xtatib bo'lmaydi. Vaqt avtomatik hisoblanadi.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfirm(false)} 
              className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button 
              onClick={handleStart} 
              disabled={starting} 
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Boshlash <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}

      {errorModal && <StatusModal msg={errorModal} onClose={() => setErrorModal('')} />}
    </div>
  );
};

export default ExamDetailPage;
