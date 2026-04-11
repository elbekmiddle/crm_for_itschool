import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { cn, stableOptionId } from '../lib/utils';

function normalizeOptionsList(raw: unknown): Array<{ id: string; text: string }> {
  if (raw == null) return [];
  let parsed: any = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) {
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([id, text], i) => ({
        id: stableOptionId(id, i),
        text: String(text),
      }));
    }
    return [];
  }
  return parsed.map((opt: any, i: number) => {
    if (opt != null && typeof opt === 'object') {
      return {
        id: stableOptionId(opt.id ?? opt.value, i),
        text: String(opt.text ?? opt.label ?? opt.value ?? ''),
      };
    }
    return { id: String(i + 1), text: String(opt) };
  });
}

const DEFAULT_TF: Array<{ id: string; text: string }> = [
  { id: '1', text: "To'g'ri" },
  { id: '2', text: "Noto'g'ri" },
];

// ── Multiple Choice Input ──
interface MultipleChoiceProps {
  questionId: string;
  options: Array<{ id: string; text: string }>;
  selectedId: string | null;
  onSelect: (questionId: string, optionId: string) => void;
}

export const MultipleChoiceInput: React.FC<MultipleChoiceProps> = ({
  questionId,
  options,
  selectedId,
  onSelect,
}) => (
  <div className="space-y-3">
    {options.map((opt) => (
      <label
        key={opt.id}
        className={cn(
          "flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.99]",
          selectedId === opt.id
            ? "border-[var(--accent)] bg-[var(--accent-bg)] shadow-sm"
            : "border-[var(--border)] hover:border-[var(--accent-border)] bg-[var(--bg-card)]"
        )}
      >
        <input
          type="radio"
          name={questionId}
          className="hidden"
          checked={selectedId === opt.id}
          onChange={() => onSelect(questionId, opt.id)}
        />
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors",
            selectedId === opt.id
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--bg-card)]"
          )}
        >
          {selectedId === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <span className={cn(
          "text-base font-medium",
          selectedId === opt.id ? "text-[var(--text-h)]" : "text-[var(--text)]"
        )}>
          {opt.text}
        </span>
      </label>
    ))}
  </div>
);

// ── Multi Select Input ──
interface MultiSelectProps {
  questionId: string;
  options: Array<{ id: string; text: string }>;
  selectedIds: string[];
  maxChoices?: number;
  onToggle: (questionId: string, selectedIds: string[]) => void;
}

export const MultiSelectInput: React.FC<MultiSelectProps> = ({
  questionId,
  options,
  selectedIds = [],
  maxChoices = 99,
  onToggle,
}) => {
  const handleToggle = (id: string) => {
    const isSelected = selectedIds.includes(id);
    if (!isSelected && selectedIds.length >= maxChoices) return;
    
    const next = isSelected
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
      
    onToggle(questionId, next);
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-widest mb-1 opacity-80">
        Maksimal {maxChoices} ta javob tanlang
      </p>
      {options.map((opt) => {
        const isSelected = selectedIds.includes(opt.id);
        return (
          <label
            key={opt.id}
            className={cn(
              "flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.99]",
              isSelected
                ? "border-[var(--accent)] bg-[var(--accent-bg)] shadow-sm"
                : "border-[var(--border)] hover:border-[var(--accent-border)] bg-[var(--bg-card)]"
            )}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={isSelected}
              onChange={() => handleToggle(opt.id)}
            />
            <div
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-4 shrink-0 transition-all",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--bg-card)]"
              )}
            >
              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
            </div>
            <span className={cn(
              "text-base font-medium",
              isSelected ? "text-[var(--text-h)]" : "text-[var(--text)]"
            )}>
              {opt.text}
            </span>
          </label>
        );
      })}
    </div>
  );
};

// ── Text Input ──
interface TextInputProps {
  questionId: string;
  value: string;
  onChange: (questionId: string, value: string) => void;
}

export const TextAnswerInput: React.FC<TextInputProps> = ({
  questionId,
  value,
  onChange,
}) => (
  <textarea
    className="w-full min-h-[220px] p-6 text-base bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-3xl outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all resize-none font-medium leading-relaxed text-[var(--text-h)] placeholder:text-[var(--text)]"
    placeholder="Javobingizni bu yerga batafsil yozing..."
    spellCheck={false}
    value={value}
    onChange={(e) => onChange(questionId, e.target.value)}
  />
);

export const CodeEditorInput: React.FC<TextInputProps> = ({
  questionId,
  value,
  onChange,
}) => {
  const [output, setOutput] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(questionId, nextValue);
      
      // Set cursor after the tab (requires a timeout for React's re-render)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleRun = () => {
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      
      // Basic sandbox
      const fn = new Function(value);
      fn();
      
      console.log = originalLog;
      setOutput(logs.join('\n') || 'Kod muvaffaqiyatli bajarildi (hech narsa print qilinmadi)');
    } catch (err: any) {
      setOutput(`Xatolik: ${err.message}`);
    }
  };

  return (
    <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-[var(--border)] bg-[#0c0d12] shadow-2xl flex flex-col">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-400/80 rounded-full" />
          <div className="w-3 h-3 bg-amber-400/80 rounded-full" />
          <div className="w-3 h-3 bg-green-400/80 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">JavaScript Editor</span>
          <button 
            onClick={handleRun}
            className="px-4 py-1.5 bg-[var(--accent)] hover:brightness-110 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
          >
            <Play className="w-3 h-3 fill-current" /> Sinab ko'rish
          </button>
        </div>
      </div>
      <textarea
        className="w-full min-h-[350px] p-8 text-sm font-mono bg-transparent text-[#c4b5fd] outline-none transition-all resize-none leading-relaxed selection:bg-[var(--accent)]/30"
        placeholder="// Kodingizni bu yerga yozing..."
        spellCheck={false}
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(e) => onChange(questionId, e.target.value)}
      />
      {output && (
        <div className="bg-slate-900/80 border-t border-slate-800 p-6 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">Natija (Console)</span>
            <button onClick={() => setOutput(null)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase transition-colors">Yopish</button>
          </div>
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
};

// ── Combined AnswerInput ──
interface AnswerInputProps {
  question: any;
  value: any;
  onChange: (value: any) => void;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
  question,
  value,
  onChange,
}) => {
  const rawType = String(question.type || 'text')
    .toLowerCase()
    .replace(/-/g, '_');
  let qType = rawType;
  if (qType === 'multi_select' || qType === 'multiple_select') {
    qType = 'multi_select';
  }

  let options = normalizeOptionsList(question.options);

  if (
    ['boolean', 'tf', 'true_false', 'yes_no'].includes(qType) &&
    options.length < 2
  ) {
    options = DEFAULT_TF;
  }

  if (
    qType !== 'multi_select' &&
    ['select', 'mcq', 'single_choice', 'radio', 'boolean', 'tf', 'true_false', 'yes_no'].includes(qType)
  ) {
    qType = 'multiple_choice';
  }

  const looksLikeSelection =
    options.length >= 2 &&
    !['code', 'multi_select'].includes(qType);

  if (looksLikeSelection && ['text', 'short_answer', 'essay', 'open', 'long_text'].includes(qType)) {
    qType = 'multiple_choice';
  }

  if (qType === 'multiple_choice') {
    return (
      <MultipleChoiceInput
        questionId={question.id}
        options={options}
        selectedId={value != null && value !== '' ? String(value) : null}
        onSelect={(_, id) => onChange(id)}
      />
    );
  }

  if (qType === 'multi_select' || qType === 'multiple_select') {
    const n = options.length;
    /**
     * Talaba tomonida "barcha to'g'ri variantlarni belgilash" muhim. Eski/standart bo'lmagan
     * `max_choices` (masalan 4) 5 ta variant bilan saqlangan bo'lsa, 5-chi tanlanmas edi.
     * Imtihon UI da yuqori chegara = variantlar soni.
     */
    const maxChoices = Math.max(1, n);
    return (
      <MultiSelectInput
        questionId={question.id}
        options={options}
        selectedIds={Array.isArray(value) ? value.map(String) : []}
        maxChoices={maxChoices}
        onToggle={(_, ids) => onChange(ids)}
      />
    );
  }

  if (qType === 'code') {
    return (
      <CodeEditorInput
        questionId={question.id}
        value={value || ''}
        onChange={(_, val) => onChange(val)}
      />
    );
  }

  return (
    <TextAnswerInput
      questionId={question.id}
      value={value || ''}
      onChange={(_, val) => onChange(val)}
    />
  );
};

export default AnswerInput;
