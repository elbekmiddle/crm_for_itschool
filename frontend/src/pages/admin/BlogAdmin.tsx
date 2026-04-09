import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { useConfirm } from '../../context/ConfirmContext';
import { 
  Plus, Loader2, Trash2, Pencil, X, Eye, Image, Save,
  Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter,
  Link as LinkIcon, Type, Palette, FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useModalOverlayEffects } from '../../hooks/useModalOverlayEffects';

// ─── Rich Text Block Types ───
type BlockType = 'paragraph' | 'heading' | 'list' | 'image' | 'divider';

interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  link?: string;
}

interface ContentBlock {
  id: string;
  type: BlockType;
  runs?: TextRun[];
  level?: number; // for headings (1,2,3)
  items?: string[]; // for lists
  src?: string; // for images
  caption?: string; // for images
  align?: 'left' | 'center' | 'right';
}

const generateId = () => Math.random().toString(36).substring(2, 10);

// ─── Mini Rich Text Editor Component ───
const RichTextEditor: React.FC<{
  content: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}> = ({ content, onChange }) => {
  const [colorOpen, setColorOpen] = useState<string | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.('[data-blog-color-picker]')) setColorOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      runs: type === 'paragraph' || type === 'heading' ? [{ text: '' }] : undefined,
      level: type === 'heading' ? 2 : undefined,
      items: type === 'list' ? [''] : undefined,
      align: 'left'
    };
    onChange([...content, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newBlocks = [...content];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    onChange(content.filter((_, i) => i !== index));
  };

  const moveBlock = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= content.length) return;
    const newBlocks = [...content];
    [newBlocks[from], newBlocks[to]] = [newBlocks[to], newBlocks[from]];
    onChange(newBlocks);
  };

  const updateRunStyle = (blockIdx: number, runIdx: number, style: Partial<TextRun>) => {
    const block = content[blockIdx];
    if (!block.runs) return;
    const newRuns = [...block.runs];
    newRuns[runIdx] = { ...newRuns[runIdx], ...style };
    updateBlock(blockIdx, { runs: newRuns });
  };

  const addRun = (blockIdx: number) => {
    const block = content[blockIdx];
    if (!block.runs) return;
    updateBlock(blockIdx, { runs: [...block.runs, { text: '' }] });
  };

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#000000'];

  return (
    <div className="space-y-3">
      {content.map((block, bIdx) => (
        <div key={block.id} className="group relative border border-slate-100 dark:border-[#2e303a] rounded-2xl p-4 bg-white dark:bg-[#1f2028] hover:border-[#aa3bff]/30 transition-all">
          {/* Block Controls */}
          <div className="absolute -top-3 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => moveBlock(bIdx, 'up')} className="w-6 h-6 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-[10px] font-bold text-slate-400 hover:text-[#aa3bff] transition-colors">↑</button>
            <button onClick={() => moveBlock(bIdx, 'down')} className="w-6 h-6 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-[10px] font-bold text-slate-400 hover:text-[#aa3bff] transition-colors">↓</button>
            <button onClick={() => removeBlock(bIdx)} className="w-6 h-6 bg-white dark:bg-[#16171d] border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>

          {/* Block Type Label */}
          <div className="text-[9px] font-black text-[#aa3bff] uppercase tracking-widest mb-2 opacity-60">
            {block.type === 'paragraph' ? 'Matn' : block.type === 'heading' ? `Sarlavha H${block.level}` : block.type === 'list' ? "Ro'yxat" : block.type === 'image' ? 'Rasm' : 'Ajratgich'}
          </div>

          {/* Heading */}
          {block.type === 'heading' && (
            <div className="space-y-2">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3].map(l => (
                  <button key={l} onClick={() => updateBlock(bIdx, { level: l })}
                    className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      block.level === l ? "bg-[#aa3bff] text-white" : "bg-slate-100 dark:bg-[#16171d] text-slate-500 hover:text-[#aa3bff]"
                    )}>H{l}</button>
                ))}
              </div>
              {(block.runs || []).map((run, rIdx) => (
                <div key={rIdx} className="flex items-center gap-2">
                  <input
                    value={run.text}
                    onChange={e => {
                      const newRuns = [...(block.runs || [])];
                      newRuns[rIdx] = { ...newRuns[rIdx], text: e.target.value };
                      updateBlock(bIdx, { runs: newRuns });
                    }}
                    className={cn("flex-1 bg-transparent border-none outline-none font-black text-[#08060d] dark:text-white",
                      block.level === 1 ? 'text-3xl' : block.level === 2 ? 'text-2xl' : 'text-xl'
                    )}
                    placeholder="Sarlavha..."
                    style={{ color: run.color || undefined }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Paragraph with inline styles */}
          {block.type === 'paragraph' && (
            <div className="space-y-2">
              {(block.runs || []).map((run, rIdx) => (
                <div key={rIdx} className="flex items-start gap-2">
                  {/* Style buttons */}
                  <div className="flex flex-wrap gap-1 shrink-0 pt-1">
                    <button onClick={() => updateRunStyle(bIdx, rIdx, { bold: !run.bold })}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
                        run.bold ? "bg-[#aa3bff] text-white" : "bg-slate-100 dark:bg-[#16171d] text-slate-500 hover:text-[#aa3bff]"
                      )}><Bold className="w-3.5 h-3.5" /></button>
                    <button onClick={() => updateRunStyle(bIdx, rIdx, { italic: !run.italic })}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
                        run.italic ? "bg-[#aa3bff] text-white" : "bg-slate-100 dark:bg-[#16171d] text-slate-500 hover:text-[#aa3bff]"
                      )}><Italic className="w-3.5 h-3.5" /></button>
                    <button onClick={() => updateRunStyle(bIdx, rIdx, { underline: !run.underline })}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
                        run.underline ? "bg-[#aa3bff] text-white" : "bg-slate-100 dark:bg-[#16171d] text-slate-500 hover:text-[#aa3bff]"
                      )}><UnderlineIcon className="w-3.5 h-3.5" /></button>
                    <div className="relative" data-blog-color-picker>
                      <button
                        type="button"
                        onClick={() =>
                          setColorOpen((o) => (o === `${bIdx}-${rIdx}` ? null : `${bIdx}-${rIdx}`))
                        }
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#16171d] text-slate-500 hover:text-[#aa3bff] transition-all',
                          colorOpen === `${bIdx}-${rIdx}` && 'ring-2 ring-[#aa3bff]/50',
                        )}
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                      {colorOpen === `${bIdx}-${rIdx}` && (
                        <div
                          className="absolute top-full left-0 z-[80] mt-1 grid w-28 grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-[#2e303a] dark:bg-[#1f2028]"
                          data-blog-color-picker
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {colors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                updateRunStyle(bIdx, rIdx, { color: c });
                                setColorOpen(null);
                              }}
                              className="h-6 w-6 rounded-lg border border-slate-100 transition-transform hover:scale-125 dark:border-[#2e303a]"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              updateRunStyle(bIdx, rIdx, { color: undefined });
                              setColorOpen(null);
                            }}
                            className="col-span-4 h-6 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 hover:bg-slate-50 dark:border-[#2e303a] dark:hover:bg-[#2e303a]"
                          >
                            Tozalash
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={run.text}
                    onChange={e => {
                      const newRuns = [...(block.runs || [])];
                      newRuns[rIdx] = { ...newRuns[rIdx], text: e.target.value };
                      updateBlock(bIdx, { runs: newRuns });
                    }}
                    rows={2}
                    className={cn(
                      "flex-1 bg-slate-50 dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-xl p-3 text-sm text-[#08060d] dark:text-white outline-none focus:border-[#aa3bff]/50 resize-none transition-colors",
                      run.bold && 'font-bold', run.italic && 'italic', run.underline && 'underline'
                    )}
                    style={{ color: run.color || undefined }}
                    placeholder="Matn yozing..."
                  />
                </div>
              ))}
              <button onClick={() => addRun(bIdx)} className="text-[10px] font-black text-[#aa3bff] uppercase tracking-widest hover:underline">+ Yangi qism (boshqa stil)</button>
            </div>
          )}

          {/* List */}
          {block.type === 'list' && (
            <div className="space-y-2">
              {(block.items || []).map((item, iIdx) => (
                <div key={iIdx} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#aa3bff]/10 text-[#aa3bff] rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{iIdx + 1}</span>
                  <input
                    value={item}
                    onChange={e => {
                      const items = [...(block.items || [])];
                      items[iIdx] = e.target.value;
                      updateBlock(bIdx, { items });
                    }}
                    className="flex-1 bg-slate-50 dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-xl px-3 py-2 text-sm text-[#08060d] dark:text-white outline-none focus:border-[#aa3bff]/50 transition-colors"
                    placeholder={`Band ${iIdx + 1}...`}
                  />
                  <button onClick={() => {
                    const items = (block.items || []).filter((_, i) => i !== iIdx);
                    updateBlock(bIdx, { items });
                  }} className="text-slate-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => updateBlock(bIdx, { items: [...(block.items || []), ''] })} className="text-[10px] font-black text-[#aa3bff] uppercase tracking-widest hover:underline">+ Band qo'shish</button>
            </div>
          )}

          {/* Image */}
          {block.type === 'image' && (
            <div className="space-y-3">
              <input
                value={block.src || ''}
                onChange={e => updateBlock(bIdx, { src: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#aa3bff]/50 transition-colors"
                placeholder="Rasm URL manzili..."
              />
              <input
                value={block.caption || ''}
                onChange={e => updateBlock(bIdx, { caption: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#aa3bff]/50 transition-colors"
                placeholder="Rasm tavsifi (ixtiyoriy)..."
              />
              {block.src && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-[#2e303a]">
                  <img src={block.src} alt={block.caption || ''} className="w-full h-48 object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          {block.type === 'divider' && (
            <hr className="border-slate-200 dark:border-[#2e303a] my-2" />
          )}
        </div>
      ))}

      {/* Add Block Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-[#16171d] rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#2e303a]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center mr-2">Block qo'shish:</span>
        {[
          { type: 'paragraph' as BlockType, icon: Type, label: 'Matn' },
          { type: 'heading' as BlockType, icon: FileText, label: 'Sarlavha' },
          { type: 'list' as BlockType, icon: List, label: "Ro'yxat" },
          { type: 'image' as BlockType, icon: Image, label: 'Rasm' },
          { type: 'divider' as BlockType, icon: AlignCenter, label: 'Chiziq' },
        ].map(b => (
          <button key={b.type} onClick={() => addBlock(b.type)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1f2028] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#aa3bff] hover:text-[#aa3bff] transition-all">
            <b.icon className="w-4 h-4" />
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Blog Admin Page ───
const BlogAdminPage: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    content: [] as ContentBlock[],
    image_url: '',
    category: '',
    status: 'draft'
  });

  useModalOverlayEffects(!!modal, {
    onEscape: () => {
      if (!saveBusy) setModal(null);
    },
  });

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/blogs');
      setBlogs(Array.isArray(data) ? data : (data?.data || []));
    } catch { setBlogs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const resetForm = () => setForm({ title: '', content: [], image_url: '', category: '', status: 'draft' });

  const openCreate = () => {
    resetForm();
    setEditTarget(null);
    setModal('create');
  };

  const openEdit = (blog: any) => {
    setEditTarget(blog);
    let parsedContent: ContentBlock[] = [];
    try {
      parsedContent = typeof blog.content === 'string' ? JSON.parse(blog.content) : (blog.content || []);
    } catch {
      parsedContent = [{ id: generateId(), type: 'paragraph', runs: [{ text: blog.content || '' }] }];
    }
    setForm({
      title: blog.title || '',
      content: parsedContent,
      image_url: blog.image_url || '',
      category: blog.category || '',
      status: blog.status || 'draft'
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("Sarlavha kiritilishi shart!", 'error');
      return;
    }
    if (saveBusy) return;
    setSaveBusy(true);
    try {
      const payload = { ...form, content: JSON.stringify(form.content) };
      if (modal === 'create') {
        await api.post('/blogs', payload);
        showToast('Blog muvaffaqiyatli yaratildi!', 'success');
      } else if (editTarget) {
        await api.patch(`/blogs/${editTarget.id}`, payload);
        showToast('Blog yangilandi!', 'success');
      }
      setModal(null);
      fetchBlogs();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setSaveBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: "Blogni o'chirish?", message: "Bu blog butunlay o'chiriladi.", type: 'danger', confirmText: "O'CHIRISH" });
    if (ok) {
      try {
        await api.delete(`/blogs/${id}`);
        showToast("O'chirildi!", 'success');
        fetchBlogs();
      } catch {
        showToast("O'chirishda xatolik", 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#08060d] dark:text-white tracking-tight">Blog Boshqaruvi</h1>
          <p className="text-sm text-[#6b6375] dark:text-[#9ca3af] mt-1 font-medium">Maqolalar yarating, tahrirlang va nashr qiling.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[#aa3bff] text-white rounded-2xl font-bold text-sm hover:bg-[#9329e6] transition-all shadow-xl shadow-[#aa3bff]/20 active:scale-95">
          <Plus className="w-5 h-5" /> Yangi Blog
        </button>
      </div>

      {/* Blog Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#aa3bff]" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 bg-[#aa3bff]/10 rounded-3xl flex items-center justify-center">
            <FileText className="w-10 h-10 text-[#aa3bff] opacity-40" />
          </div>
          <p className="text-sm text-[#6b6375] font-bold">Hozircha blog maqolalari yo'q</p>
          <button onClick={openCreate} className="text-sm font-bold text-[#aa3bff] hover:underline">Birinchi maqolani yarating →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog: any) => (
            <div key={blog.id} className="card p-0 overflow-hidden group hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-[#1f2028] border border-[#e5e4e7] dark:border-[#2e303a]">
              {blog.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-[#aa3bff]/10 to-[#c084fc]/5 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-[#aa3bff] opacity-20" />
                </div>
              )}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest",
                    blog.status === 'published' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  )}>{blog.status === 'published' ? 'Nashr' : 'Qoralama'}</span>
                  {blog.category && <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#16171d] text-[9px] font-black text-slate-500 uppercase tracking-widest">{blog.category}</span>}
                </div>
                <h3 className="text-lg font-black text-[#08060d] dark:text-white tracking-tight leading-tight">{blog.title}</h3>
                <p className="text-xs text-[#6b6375] font-medium">
                  {blog.author_name || 'Admin'} · {new Date(blog.created_at).toLocaleDateString('uz-UZ')} · {blog.views_count || 0} ko'rish
                </p>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(blog)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-[#16171d] rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-[#aa3bff]/10 hover:text-[#aa3bff] transition-all">
                    <Pencil className="w-4 h-4" /> Tahrirlash
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 rounded-xl text-sm font-bold text-red-500 hover:bg-red-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal (Full Screen) */}
      {modal && (
        <div className="fixed inset-0 z-[100] m-0 flex min-h-[100dvh] flex-col p-0">
          <button
            type="button"
            aria-label="Yopish fon"
            className="absolute inset-0 bg-[#08060d]/55 backdrop-blur-[6px]"
            onClick={() => !saveBusy && setModal(null)}
          />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-[#16171d]">
            <div className="shrink-0 border-b border-[#e5e4e7] bg-white/90 backdrop-blur-[6px] dark:border-[#2e303a] dark:bg-[#16171d]/90">
              <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <button
                    type="button"
                    disabled={saveBusy}
                    onClick={() => setModal(null)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50 dark:bg-[#1f2028] dark:hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight text-[#08060d] dark:text-white">
                    {modal === 'create' ? 'Yangi Blog Yaratish' : 'Blogni Tahrirlash'}
                  </h2>
                </div>
                <div className="flex w-fit shrink-0 flex-wrap items-center gap-3">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-[#08060d] outline-none dark:border-[#2e303a] dark:bg-[#1f2028] dark:text-white"
                  >
                    <option value="draft">Qoralama</option>
                    <option value="published">Nashr qilish</option>
                  </select>
                  <button
                    type="button"
                    disabled={saveBusy}
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-xl bg-[#aa3bff] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#aa3bff]/20 transition-all hover:bg-[#9329e6] active:scale-[0.98] disabled:opacity-60"
                  >
                    {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saveBusy ? 'Saqlanmoqda…' : 'Saqlash'}
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
            {/* Meta Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest mb-1.5 block">Sarlavha *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#1f2028] border border-slate-200 dark:border-[#2e303a] rounded-2xl px-5 py-4 text-2xl font-black text-[#08060d] dark:text-white outline-none focus:border-[#aa3bff] transition-colors"
                  placeholder="Blog sarlavhasi..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest mb-1.5 block">Asosiy rasm (URL)</label>
                <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#1f2028] border border-slate-200 dark:border-[#2e303a] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#aa3bff] transition-colors"
                  placeholder="https://example.com/rasm.jpg" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest mb-1.5 block">Kategoriya</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#1f2028] border border-slate-200 dark:border-[#2e303a] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#aa3bff] transition-colors"
                  placeholder="Frontend, Backend, UX/UI..." />
              </div>
            </div>

            {/* Preview Image */}
            {form.image_url && (
              <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-[#2e303a] shadow-lg">
                <img src={form.image_url} alt="Preview" className="w-full h-56 object-cover" />
              </div>
            )}

            {/* Rich Text Editor */}
            <div>
              <label className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest mb-3 block">Maqola matni (Rich Editor)</label>
              <RichTextEditor content={form.content} onChange={content => setForm({ ...form, content })} />
            </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogAdminPage;
