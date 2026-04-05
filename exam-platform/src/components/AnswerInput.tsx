import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '../lib/utils';

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
            ? "border-primary-500 bg-primary-50/70 shadow-sm shadow-primary-100"
            : "border-slate-100 hover:border-slate-300 bg-slate-50/50"
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
              ? "border-primary-600 bg-primary-600"
              : "border-slate-300 bg-white"
          )}
        >
          {selectedId === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <span className={cn(
          "text-base font-medium",
          selectedId === opt.id ? "text-primary-900" : "text-slate-700"
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
  maxChoices = 4,
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
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
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
                ? "border-primary-500 bg-primary-50/70 shadow-sm shadow-primary-100"
                : "border-slate-100 hover:border-slate-300 bg-slate-50/50"
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
                  ? "border-primary-600 bg-primary-600"
                  : "border-slate-300 bg-white"
              )}
            >
              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
            </div>
            <span className={cn(
              "text-base font-medium",
              isSelected ? "text-primary-900" : "text-slate-700"
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
    className="w-full min-h-[220px] p-6 text-base bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-3xl outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none font-medium leading-relaxed dark:text-slate-200"
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
    <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
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
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
          >
            <Play className="w-3 h-3 fill-current" /> Sinab ko'rish
          </button>
        </div>
      </div>
      <textarea
        className="w-full min-h-[350px] p-8 text-sm font-mono bg-transparent text-indigo-300 outline-none transition-all resize-none leading-relaxed selection:bg-indigo-500/30"
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
  if (question.type === 'multiple_choice') {
    return (
      <MultipleChoiceInput
        questionId={question.id}
        options={question.options || []}
        selectedId={value || null}
        onSelect={(_, id) => onChange(id)}
      />
    );
  }
  
  if (question.type === 'multi_select') {
    return (
      <MultiSelectInput
        questionId={question.id}
        options={question.options || []}
        selectedIds={Array.isArray(value) ? value : []}
        maxChoices={question.max_choices || 3}
        onToggle={(_, ids) => onChange(ids)}
      />
    );
  }

  if (question.type === 'code') {
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
