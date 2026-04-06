import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Eye, EyeOff, Lock, Clock, Users, Shield, Bell,
  BarChart3, Save, X, AlertCircle, ChevronDown
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';

interface ExamSettings {
  title: string;
  courseId: string;
  durationMinutes: number;
  passingScore: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  showAnswersFeedback: boolean;
  allowReview: boolean;
  hideCorrectAnswers: boolean;
  randomizeAnswerOrder: boolean;
  enableAntiCheat: boolean;
  maxAttempts: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  description: string;
  instructions: string;
  timeWarningMinutes: number;
  allowCalculator: boolean;
  allowNotes: boolean;
  showProgressBar: boolean;
  showTimer: boolean;
  allowBackTracking: boolean;
  lockQuestions: boolean;
  ipRestriction: string[];
  proctorRequired: boolean;
  recordSession: boolean;
  verifyIdentity: boolean;
  fullScreenRequired: boolean;
  webcamRequired: boolean;
  microphoneRequired: boolean;
  notificationEmail: string;
}

interface ExamSettingsProps {
  examId?: string;
  initialSettings?: Partial<ExamSettings>;
  onSave: (settings: ExamSettings) => Promise<void>;
  onCancel: () => void;
}

const defaultSettings: ExamSettings = {
  title: 'Yangi Imtihon',
  courseId: '',
  durationMinutes: 60,
  passingScore: 60,
  totalPoints: 100,
  shuffleQuestions: true,
  showAnswersFeedback: true,
  allowReview: true,
  hideCorrectAnswers: false,
  randomizeAnswerOrder: true,
  enableAntiCheat: true,
  maxAttempts: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '18:00',
  description: '',
  instructions: '',
  timeWarningMinutes: 5,
  allowCalculator: false,
  allowNotes: false,
  showProgressBar: true,
  showTimer: true,
  allowBackTracking: true,
  lockQuestions: false,
  ipRestriction: [],
  proctorRequired: false,
  recordSession: false,
  verifyIdentity: false,
  fullScreenRequired: false,
  webcamRequired: false,
  microphoneRequired: false,
  notificationEmail: '',
};

const ExamSettingsPanel: React.FC<ExamSettingsProps> = ({
  examId,
  initialSettings,
  onSave,
  onCancel,
}) => {
  const confirm = useConfirm();
  const [settings, setSettings] = useState<ExamSettings>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'basic' | 'timing' | 'display' | 'security' | 'proctoring'
  >('basic');

  const handleSave = async () => {
    if (!settings.title.trim()) {
      toast.error('Imtihon nomini kiriting!');
      return;
    }

    if (!settings.courseId) {
      toast.error('Kursni tanlang!');
      return;
    }

    const ok = await confirm({
      title: 'Imtihon sozlamalarini saqlash?',
      message: 'Barcha sozlamalar saqlanadi.',
      confirmText: 'SAQLASH',
      type: 'info',
    });

    if (!ok) return;

    setIsSaving(true);
    try {
      await onSave(settings);
      toast.success('Sozlamalar saqlandi!');
    } catch (error: any) {
      toast.error(error.message || 'Xato yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Asosiy', icon: Settings },
    { id: 'timing', label: 'Vaqt', icon: Clock },
    { id: 'display', label: 'Ko\'rinish', icon: Eye },
    { id: 'security', label: 'Xavfsizlik', icon: Shield },
    { id: 'proctoring', label: 'Kuzatuv', icon: Users },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-black">Imtihon Sozlamalari</h2>
            <p className="text-xs opacity-90 font-bold">Barcha parametrlarni sozlang</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 flex gap-1 sticky top-16 z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 flex items-center gap-2 font-bold text-sm border-b-2 transition-all ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-8">
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <label className="input-label">Imtihon Nomi</label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                className="input"
                placeholder="Midterm Exam 2026"
              />
            </div>

            <div>
              <label className="input-label">Kurs</label>
              <select
                value={settings.courseId}
                onChange={(e) => setSettings({ ...settings, courseId: e.target.value })}
                className="select font-bold"
              >
                <option value="">Kursni tanlang</option>
                <option value="course1">JavaScript Basics</option>
                <option value="course2">React Advanced</option>
                <option value="course3">Node.js Backend</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Jami Ball</label>
                <input
                  type="number"
                  value={settings.totalPoints}
                  onChange={(e) =>
                    setSettings({ ...settings, totalPoints: parseInt(e.target.value) || 0 })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">O'tish Bali (%)</label>
                <input
                  type="number"
                  value={settings.passingScore}
                  onChange={(e) =>
                    setSettings({ ...settings, passingScore: parseInt(e.target.value) || 0 })
                  }
                  className="input"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Tavsifi</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="input min-h-24"
                placeholder="Imtihon tavsifi..."
              />
            </div>

            <div>
              <label className="input-label">Ko'rsatmalar</label>
              <textarea
                value={settings.instructions}
                onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                className="input min-h-24"
                placeholder="Studentlar uchun qo'llash ko'rsatmalari..."
              />
            </div>
          </motion.div>
        )}

        {/* TIMING TAB */}
        {activeTab === 'timing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Vaqt Davomiyligi (daqiqa)</label>
                <input
                  type="number"
                  value={settings.durationMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, durationMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="input"
                  min={5}
                />
              </div>
              <div>
                <label className="input-label">Maksimal Urinishlar</label>
                <input
                  type="number"
                  value={settings.maxAttempts}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAttempts: parseInt(e.target.value) || 1 })
                  }
                  className="input"
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Boshlanish Sanasi</label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">Tugash Sanasi</label>
                <input
                  type="date"
                  value={settings.endDate}
                  onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Boshlanish Vaqti</label>
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">Tugash Vaqti</label>
                <input
                  type="time"
                  value={settings.endTime}
                  onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Vaqt Ogohlantirish (daqiqa)</label>
              <input
                type="number"
                value={settings.timeWarningMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, timeWarningMinutes: parseInt(e.target.value) || 0 })
                }
                className="input"
                min={1}
              />
              <p className="text-xs text-slate-400 mt-2">
                Qolgan vaqt quyidagiga teng yoki kam bo'lganda ogohlantirish ko'rsatiladi
              </p>
            </div>
          </motion.div>
        )}

        {/* DISPLAY TAB */}
        {activeTab === 'display' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {[
              {
                key: 'shuffleQuestions',
                label: 'Savollarni Shtrixni Berilgan',
                desc: 'Har bir talaba uchun savollar tartibini tasodifiy qiling',
              },
              {
                key: 'randomizeAnswerOrder',
                label: 'Javoblar Variantlarini Tasodifiy',
                desc: 'Javob variantlari tartibini tasodifiy qiling',
              },
              {
                key: 'showProgressBar',
                label: 'Progress Bar Koʻrsatish',
                desc: 'Imtihondagi progress ko\'rsatiladi',
              },
              {
                key: 'showTimer',
                label: 'Qolgan Vaqt Koʻrsatish',
                desc: 'Timer doimiy ko\'rinadi',
              },
              {
                key: 'allowBackTracking',
                label: 'Orqaga Qaytishga Ruxsat',
                desc: 'Talabalar oldingi savollarga qayta kirishlari mumkin',
              },
              {
                key: 'showAnswersFeedback',
                label: 'Javoblar Haqida Feedback',
                desc: 'Imtihon tugagach to\'g\'ri/noto\'g\'ri javoblar ko\'rsatiladi',
              },
              {
                key: 'allowReview',
                label: 'Imtihonni Qayta Ko\'rish',
                desc: 'Talabalar o\'z javoblarini qayta ko\'rishlari mumkin',
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 transition"
              >
                <input
                  type="checkbox"
                  checked={settings[setting.key as keyof ExamSettings] as boolean}
                  onChange={(e) =>
                    setSettings({ ...settings, [setting.key]: e.target.checked })
                  }
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-700">{setting.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{setting.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {[
              {
                key: 'enableAntiCheat',
                label: 'Anti-Cheat Monitoring',
                desc: 'Tab o\'zgartirlash, copy-paste va boshqa shubhali harakatlarni kuzating',
              },
              {
                key: 'fullScreenRequired',
                label: 'Full Screen Majburiy',
                desc: 'Talabalar full screen rejimida imtihonni bajarishi kerak',
              },
              {
                key: 'lockQuestions',
                label: 'Savollarni Qayta Tuzish Taqiqlangan',
                desc: 'Javob berilgan savollar tahrirlashni taqiqlang',
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 transition"
              >
                <input
                  type="checkbox"
                  checked={settings[setting.key as keyof ExamSettings] as boolean}
                  onChange={(e) =>
                    setSettings({ ...settings, [setting.key]: e.target.checked })
                  }
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-700">{setting.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{setting.desc}</p>
                </div>
              </div>
            ))}

            <div>
              <label className="input-label">IP Hujamlarga Ruxsat</label>
              <textarea
                placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                className="input min-h-24 font-mono text-xs"
              />
              <p className="text-xs text-slate-400 mt-2">
                Bitta satr uchun bitta IP manzil yoki CIDR notatsiya
              </p>
            </div>
          </motion.div>
        )}

        {/* PROCTORING TAB */}
        {activeTab === 'proctoring' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {[
              {
                key: 'proctorRequired',
                label: 'Prokuror Majburiy',
                desc: 'Imtihon proktori bilan kuzatiladi',
              },
              {
                key: 'recordSession',
                label: 'Sessiyani Yozib Olish',
                desc: 'Talabalarning imtihon sessiyasini video sifatida saqlang',
              },
              {
                key: 'verifyIdentity',
                label: 'Identifikatsiyani Tasdiqlash',
                desc: 'Talabalar imtihonni boshlashdan oldin tasdiqlanadi',
              },
              {
                key: 'webcamRequired',
                label: 'Veb-Kamera Majburiy',
                desc: 'Talabalar veb-kamerani yoqishi kerak',
              },
              {
                key: 'microphoneRequired',
                label: 'Mikrofon Majburiy',
                desc: 'Talabalar mikrofonni yoqishi kerak',
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 transition"
              >
                <input
                  type="checkbox"
                  checked={settings[setting.key as keyof ExamSettings] as boolean}
                  onChange={(e) =>
                    setSettings({ ...settings, [setting.key]: e.target.checked })
                  }
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-700">{setting.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{setting.desc}</p>
                </div>
              </div>
            ))}

            <div>
              <label className="input-label">Bildirishnoma Elektron Pochta</label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                className="input"
                placeholder="teacher@example.com"
              />
              <p className="text-xs text-slate-400 mt-2">
                Imtihon tugaganda bildirishnoma yuboriladi
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
        <button onClick={onCancel} className="btn-secondary px-6 py-3">
          Bekor Qilish
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary px-6 py-3 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              SAQLASH
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExamSettingsPanel;
