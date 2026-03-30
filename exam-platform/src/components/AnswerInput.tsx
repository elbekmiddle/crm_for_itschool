import React from 'react';
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
    className="w-full min-h-[200px] p-5 text-base bg-slate-50/80 border-2 border-slate-200 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all resize-none"
    placeholder="Javobingizni bu yerga yozing..."
    value={value}
    onChange={(e) => onChange(questionId, e.target.value)}
  />
);

// ── Combined AnswerInput ──
interface AnswerInputProps {
  questionId: string;
  type: 'multiple_choice' | 'text';
  options?: Array<{ id: string; text: string }>;
  currentAnswer: any;
  onAnswer: (questionId: string, answer: any) => void;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
  questionId,
  type,
  options = [],
  currentAnswer,
  onAnswer,
}) => {
  if (type === 'multiple_choice') {
    return (
      <MultipleChoiceInput
        questionId={questionId}
        options={options}
        selectedId={currentAnswer || null}
        onSelect={onAnswer}
      />
    );
  }
  return (
    <TextAnswerInput
      questionId={questionId}
      value={currentAnswer || ''}
      onChange={onAnswer}
    />
  );
};

export default AnswerInput;
