import React from 'react';
import { useExamStore } from '../store/useExamStore';
import { CheckCircle2, Home, BarChart3, Clock, AlertCircle } from 'lucide-react';

const ResultPage: React.FC = () => {
  const { results, reset } = useExamStore(); // I'll assume results contains { score, total, timeTaken }
  
  // Fake result data for preview if store not populated
  const data = results || { score: 24, total: 30, timeTaken: '52 min' };
  const percentage = (data.score / data.total) * 100;

  const isHigh = percentage >= 80;
  const isMed = percentage >= 50 && percentage < 80;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center space-y-12">
        
        {/* Badge Section */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className={`p-8 rounded-full shadow-2xl relative ${isHigh ? 'bg-green-100' : isMed ? 'bg-indigo-100' : 'bg-red-100'}`}>
            <span className="text-8xl scale-150 relative z-10">{isHigh ? '😎' : isMed ? '😐' : '😂'}</span>
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isHigh ? 'bg-green-500' : isMed ? 'bg-indigo-500' : 'bg-red-500'}`} />
          </div>
          <h1 className={`text-5xl font-black ${isHigh ? 'text-green-600' : isMed ? 'text-indigo-600' : 'text-red-600'}`}>
            {isHigh ? 'Ajoyib Natija!' : isMed ? 'Yomon emas' : 'Yana harakat qiling'}
          </h1>
        </div>

        {/* Stats Card */}
        <div className="glass-card p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden bg-white/80 border border-white">
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
              <div className="text-slate-400 flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">To'g'ri Javoblar</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-800">{data.score} / {data.total}</div>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
              <div className="text-slate-400 flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Sarflandi</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-800">{data.timeTaken}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${isHigh ? 'bg-green-500' : isMed ? 'bg-indigo-500' : 'bg-red-500'}`} 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
              <span>0%</span>
              <span>Natija: {percentage.toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          <button className="flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary-200 transition-all active:scale-95 group">
            <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" /> Javoblar Tahlili
          </button>
          
          <button 
            onClick={() => { reset(); window.location.href = '/dashboard'; }}
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold py-5 rounded-2xl transition-all"
          >
            <Home className="w-6 h-6" /> Asosiy Sahifa
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResultPage;
