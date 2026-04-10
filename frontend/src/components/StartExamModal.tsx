import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ShieldAlert, CheckSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle: string;
}

export default function StartExamModal({ isOpen, onClose, examId, examTitle }: Props) {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  useModalOverlayEffects(isOpen, { onEscape: onClose });

  const handleStart = () => {
    if (agreed) {
      navigate(`/student/exam-session/${examId}`);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[10000]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[10001] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl pointer-events-auto overflow-hidden text-left relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-10 pb-8">
                <div className="w-16 h-16 rounded-3xl bg-primary-50 flex items-center justify-center text-primary-600 mb-6 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-snug mb-2">
                  Imtihon qoidalari bilan tanishing
                </h3>
                <p className="text-slate-500 font-medium mb-8">
                  <strong className="text-slate-800">{examTitle}</strong> imtihonini boshlashdan oldin quyidagi shartlarni qabul qilishingiz kerak:
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      1
                    </div>
                    <div className="text-sm font-semibold text-slate-700 mt-1">
                      Imtihon paytida boshqa oynalarga (tab) o'tish taqiqlanadi. 3 marta ogohlantirilgach qoida buzilsa, imtihon majburan yakunlanadi.
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                      2
                    </div>
                    <div className="text-sm font-semibold text-slate-700 mt-1">
                      Sahifani yangilamang yoki yopmang, bu holda nazorat tizimi o'zgarishlarni saqlamaydi va qoidabuzarlik deb baholashi mumkin.
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      3
                    </div>
                    <div className="text-sm font-semibold text-slate-700 mt-1">
                      Berilgan vaqt tugaganda, imtihon avtomatik tarzda topshiriladi.
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors mb-8 group">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${agreed ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
                    {agreed && <CheckSquare className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-800">Qoidalarga roziman va tushundim</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={agreed} 
                    onChange={e => setAgreed(e.target.checked)} 
                  />
                </label>

                <button 
                  onClick={handleStart}
                  disabled={!agreed}
                  className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-200 disabled:shadow-none"
                >
                  <Play className="w-5 h-5 fill-white" /> Imtihonni Boshlash
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
