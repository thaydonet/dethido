'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminDashboard.module.css';
import 'katex/dist/katex.min.css';

interface Question {
  id: string;
  de_id: string;
  so_cau: number;
  phan: string;
  content: string;
  options: any;
  answer: string;
  explanation?: string;
  image_url?: string;
  metadata: any;
  created_at: string;
}

interface AdminDashboardProps {
  initialQuestions: Question[];
  user?: any;
}

const PAGE_SIZE = 50;

const SAMPLE_JSON = `{
  "title": "Đề kiểm tra Toán 12",
  "questions": [
    {
      "type": "mcq",
      "question": "Tìm đạo hàm của hàm số $f(x) = x^3 - 3x^2 + 2x - 1$",
      "option_a": "$f'(x) = 3x^2 - 6x + 2$",
      "option_b": "$f'(x) = x^3 - 3x^2 + 2$",
      "option_c": "$f'(x) = 3x^2 - 6x + 1$",
      "option_d": "$f'(x) = 3x^2 - 3x + 2$",
      "correct_option": "A",
      "explanation": "Áp dụng quy tắc đạo hàm",
      "difficulty_level": "easy",
      "is_dynamic": false
    }
  ]
}`;

export default function AdminDashboard({ initialQuestions, user }: AdminDashboardProps) {
  const isTeacher = user?.user_metadata?.role === 'teacher';
  const isAdmin = !isTeacher;
  const userEmail = user?.email || '';
  const hasGrant = user?.user_metadata?.hasGrant === true;
  const [questions, setQuestions] = useState(initialQuestions);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDe, setFilterDe] = useState<string>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit state
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Generator state
  const [showGeneratorConfig, setShowGeneratorConfig] = useState(false);
  const [genMcqCount, setGenMcqCount] = useState(12);
  const [genMsqCount, setGenMsqCount] = useState(4);
  const [genSaCount, setGenSaCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<Question[] | null>(null);
  const [examName, setExamName] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [examPapers, setExamPapers] = useState<{ id: string; name: string; slug?: string; question_ids: string[]; created_by_email?: string; view_count?: number }[]>([]);
  const [totalTeachers, setTotalTeachers] = useState<number>(0);

  // JSON Import state
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonParseResult, setJsonParseResult] = useState<{ valid: boolean; title?: string; count?: number; error?: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Access code — teacher redeem
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [grantActivated, setGrantActivated] = useState(hasGrant);

  // Access code — admin manage
  const [accessCodes, setAccessCodes] = useState<{ id: string; code: string; description: string; max_uses: number; used_count: number; is_active: boolean; created_at: string }[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [newCodeDesc, setNewCodeDesc] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('1');

  // Edit exam paper state
  const [editingPaper, setEditingPaper] = useState<{ id: string; name: string; slug?: string; question_ids: string[]; created_by_email?: string; view_count?: number } | null>(null);
  const [editPaperName, setEditPaperName] = useState('');
  const [editPaperQuestionIds, setEditPaperQuestionIds] = useState<string[]>([]);
  const [editPaperQuestions, setEditPaperQuestions] = useState<Question[]>([]);
  const [isSavingPaper, setIsSavingPaper] = useState(false);
  const [isLoadingPaperQs, setIsLoadingPaperQs] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/exams')
      .then(r => r.json())
      .then(d => {
        setExamPapers(d.data || []);
        if (d.totalTeachers !== undefined) setTotalTeachers(d.totalTeachers);
      })
      .catch(() => {});
    // Admin: load access codes
    if (isAdmin) {
      fetch('/api/admin/access-codes')
        .then(r => r.json())
        .then(d => setAccessCodes(d.data || []))
        .catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    if (res.ok) setQuestions(questions.filter(q => q.id !== id));
    else alert('Có lỗi xảy ra khi xóa câu hỏi');
  };

  const openEdit = (q: Question) => {
    setEditingQ(q);
    setEditForm({
      content: q.content,
      answer: q.answer,
      image_url: q.image_url || '',
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : {},
      // store metadata.explanation separately under a custom key
      metadata: { 
        ...q.metadata, 
        _editExplanation: q.metadata?.explanation || q.metadata?.loi_giai || q.explanation || '',
        _editDangToan: q.metadata?.dang_toan || '',
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQ) return;
    setIsSavingEdit(true);
    try {
      // Build updated metadata: keep existing fields, update explanation and dang_toan
      const existingMeta = editingQ.metadata || {};
      const { _editExplanation, _editDangToan, ...restMeta } = (editForm.metadata || {}) as any;
      const updatedMetadata = { 
        ...existingMeta, 
        ...restMeta, 
        explanation: _editExplanation ?? existingMeta.explanation,
        dang_toan: _editDangToan !== undefined ? _editDangToan : existingMeta.dang_toan,
      };

      const payload: any = {
        content: editForm.content,
        answer: editForm.answer,
        image_url: editForm.image_url,
        options: editForm.options,
        metadata: updatedMetadata,
      };
      const res = await fetch(`/api/admin/questions/${editingQ.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setQuestions(prev => prev.map(q =>
          q.id === editingQ.id ? { 
            ...q, 
            ...payload, 
            explanation: _editExplanation ?? q.explanation 
          } : q
        ));
        setEditingQ(null);
        alert('Lưu thành công!');
      } else {
        const d = await res.json();
        alert('Lỗi: ' + d.error);
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleSolution = (id: string) => setShowSolution(prev => ({ ...prev, [id]: !prev[id] }));

  const getQuestionType = (q: Question) => {
    if (q.metadata?.type) return q.metadata.type;
    if (q.options) {
      const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      if (opts.option_a && opts.option_b) return 'mcq';
    }
    return 'sa';
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelectedIds(new Set());

  const selectedQuestions = useMemo(
    () => questions.filter(q => selectedIds.has(q.id)),
    [questions, selectedIds]
  );

  const selectionStats = useMemo(() => ({
    total: selectedQuestions.length,
    mcq: selectedQuestions.filter(q => getQuestionType(q) === 'mcq').length,
    msq: selectedQuestions.filter(q => getQuestionType(q) === 'msq').length,
    sa: selectedQuestions.filter(q => getQuestionType(q) === 'sa').length,
  }), [selectedQuestions]);

  const handleGenerateOnlineFromSelected = () => {
    const sel = selectedQuestions;
    if (sel.length === 0) { handleGenerateExam(); return; }
    setGeneratedExam(sel);
    setIsGenerating(true);
  };

  const sortForExam = (qs: Question[]) => {
    const order: Record<string, number> = { mcq: 0, msq: 1, sa: 2 };
    return [...qs].sort((a, b) => (order[getQuestionType(a)] ?? 0) - (order[getQuestionType(b)] ?? 0));
  };

  const buildStyledHTML = (qs: Question[], withAnswers: boolean, examTitle = 'ĐỀ KIỂM TRA') => {
    const sorted = sortForExam(qs);
    const sections: { type: string; label: string; color: string; questions: { q: Question; num: number }[] }[] = [
      { type: 'mcq', label: 'PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN', color: '#1a5276', questions: [] },
      { type: 'msq', label: 'PHẦN II. TRẮC NGHIỆM ĐÚNG – SAI', color: '#117a65', questions: [] },
      { type: 'sa',  label: 'PHẦN III. TRẢ LỜI NGẮN', color: '#784212', questions: [] },
    ];
    let num = 0;
    sorted.forEach(q => {
      const t = getQuestionType(q);
      const sec = sections.find(s => s.type === t);
      if (sec) sec.questions.push({ q, num: ++num });
    });

    const mcqCount = sections[0].questions.length;
    const msqCount = sections[1].questions.length;
    const saCount  = sections[2].questions.length;

    const renderSection = (sec: typeof sections[0]) => {
      if (!sec.questions.length) return '';
      const qs_html = sec.questions.map(({ q, num: n }) => {
        const opts = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null;
        let optHtml = '';
        if (sec.type === 'mcq' && opts) {
          const letters = ['A','B','C','D'];
          optHtml = `<table class='opt-table'><tr>` +
            letters.map(l => {
              const val = opts[`option_${l.toLowerCase()}`];
              if (!val) return '';
              const isCorrect = withAnswers && q.answer && q.answer.includes(l);
              return `<td class='opt-cell${isCorrect ? ' correct-cell' : ''}'><b>${l}.</b> ${val}</td>`;
            }).join('') + `</tr></table>`;
        } else if (sec.type === 'msq' && opts) {
          optHtml = ['a','b','c','d'].map(l => {
            const val = opts[`option_${l}`];
            if (!val) return '';
            const isCorrect = withAnswers && q.answer && q.answer.toLowerCase().split(',').includes(l);
            return `<div class='msq-row'><span class='msq-label'>${l.toUpperCase()})</span><span class='msq-content'>${val}</span>` +
              `<span class='msq-tf'><span class='tf-box${withAnswers && isCorrect ? ' tf-true' : ''}'>Đúng</span>` +
              `<span class='tf-box${withAnswers && !isCorrect ? ' tf-false' : ''}'>Sai</span></span></div>`;
          }).join('');
        }
        const ansBlock = withAnswers && sec.type !== 'msq'
          ? `<div class='ans-block'>Đáp án: <b>${q.answer || ''}</b></div>` +
            (q.explanation || q.metadata?.explanation || q.metadata?.loi_giai
              ? `<div class='expl-block'><b>Lời giải:</b> ${q.explanation || q.metadata?.explanation || q.metadata?.loi_giai}</div>`
              : '')
          : sec.type === 'sa' && !withAnswers
          ? `<div class='sa-box'>Đáp số: ___________</div>` : '';
        return `<div class='question'><p class='qnum'>Câu ${n}${q.image_url ? `<img src='${q.image_url}' class='qimg'/>` : ''}</p><div class='qcontent'>${q.content}</div>${optHtml}${ansBlock}</div>`;
      }).join('');
      return `<div class='section'><div class='section-header' style='background:${sec.color}'>${sec.label}</div><div class='section-body'>${qs_html}</div></div>`;
    };

    const css = `
body{font-family:'Times New Roman',serif;max-width:210mm;margin:0 auto;padding:20mm 15mm;color:#000;font-size:13pt;background:#fff}
.doc-header{text-align:center;margin-bottom:8mm;border-bottom:3px double #000;padding-bottom:5mm}
.doc-header .school{font-size:11pt;font-weight:bold;text-transform:uppercase}
.doc-header .exam-title{font-size:16pt;font-weight:bold;text-transform:uppercase;margin:4mm 0 2mm}
.doc-header .exam-sub{font-size:12pt;font-weight:bold}
.doc-header .info{font-size:11pt;margin-top:3mm}
.section{margin:6mm 0}
.section-header{color:#fff;font-weight:bold;font-size:13pt;padding:4mm 6mm;border-radius:3px;text-transform:uppercase;letter-spacing:.5px}
.section-body{padding:4mm 0}
.question{margin:5mm 0;padding:4mm 0;border-bottom:1px dashed #ccc}
.qnum{font-weight:bold;font-size:13pt;margin:0 0 2mm}
.qcontent{margin:2mm 0 3mm;line-height:1.7}
.qimg{max-width:100%;height:auto;display:block;margin:3mm auto}
.opt-table{width:100%;border-collapse:collapse;margin:2mm 0}
.opt-cell{width:50%;padding:2mm 3mm;vertical-align:top;line-height:1.6}
.correct-cell{background:#d5f5e3;font-weight:bold}
.msq-row{display:flex;align-items:flex-start;gap:6px;margin:2mm 0;line-height:1.6}
.msq-label{font-weight:bold;min-width:22px}
.msq-content{flex:1}
.msq-tf{display:flex;gap:4px;flex-shrink:0;margin-left:6px}
.tf-box{border:1px solid #000;padding:1px 8px;font-size:11pt;min-width:42px;text-align:center}
.tf-true{background:#d5f5e3;font-weight:bold}
.tf-false{background:#fadbd8;font-weight:bold}
.ans-block{margin:3mm 0;padding:2mm 4mm;background:#d5f5e3;border-left:4px solid #1e8449;font-size:12pt}
.expl-block{margin:2mm 0;padding:3mm 4mm;background:#eaf4fb;border-left:4px solid #2e86c1;font-size:11.5pt;line-height:1.7}
.sa-box{margin:3mm 0;border-bottom:1px solid #000;height:8mm}
.footer{text-align:center;margin-top:10mm;font-size:10pt;color:#666;border-top:1px solid #ccc;padding-top:4mm}
@media print{body{margin:0;padding:15mm 12mm}.section-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    `.trim();

    const header = `<div class='doc-header'>
      <div class='school'>BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
      <div class='exam-title'>${examTitle}</div>
      <div class='exam-sub'>Môn: Toán — Lớp 12</div>
      <div class='info'>Thời gian làm bài: 90 phút (không kể thời gian giao đề)<br/>Tổng số câu: ${mcqCount + msqCount + saCount} (${mcqCount} MCQ + ${msqCount} MSQ + ${saCount} SA)</div>
    </div>`;

    const body = sections.map(renderSection).join('');
    const footer = `<div class='footer'>— HẾT —</div>`;
    return `<!DOCTYPE html><html lang='vi'><head><meta charset='UTF-8'/><title>${examTitle}</title><style>${css}</style></head><body>${header}${body}${footer}</body></html>`;
  };

  const buildExcelCSV = (qs: Question[]) => {
    const sorted = sortForExam(qs);
    const bom = '\uFEFF';
    const header = 'Số câu,Đáp án,Loại\r\n';
    const rows = sorted.map((q, i) => {
      const type = getQuestionType(q);
      return `${i + 1},"${(q.answer || '').replace(/"/g, '""')}",${type.toUpperCase()}`;
    }).join('\r\n');
    return bom + header + rows;
  };

  const buildWordDoc = (htmlContent: string) =>
    `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='UTF-8'><meta name=ProgId content=Word.Document>
    <meta name=Generator content='Microsoft Word 15'><meta name=Originator content='Microsoft Word 15'>
    <style>body{font-family:'Times New Roman';font-size:13pt}table{width:100%}</style></head>
    <body>${htmlContent}</body></html>`;

  const handleExportOffline = async (qsParam?: Question[] | any) => {
    // If called directly from an onClick event, qsParam might be a React SyntheticEvent.
    // We check if it's an array to ensure it's actually the questions array.
    const isArray = Array.isArray(qsParam);
    const qs = isArray && qsParam.length > 0 ? qsParam : (selectedQuestions.length > 0 ? selectedQuestions : []);
    if (qs.length === 0) { alert('Chưa có câu hỏi nào để xuất!'); return; }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const examHtml   = buildStyledHTML(qs, false, 'ĐỀ KIỂM TRA TOÁN 12');
    const answerHtml = buildStyledHTML(qs, true,  'ĐỀ KIỂM TRA TOÁN 12 – ĐÁP ÁN VÀ LỜI GIẢI');
    const csvContent = buildExcelCSV(qs);

    zip.file('de-thi.html',      examHtml,              { binary: false });
    zip.file('de-thi.doc',       buildWordDoc(examHtml), { binary: false });
    zip.file('dap-an-loi-giai.doc', buildWordDoc(answerHtml), { binary: false });
    zip.file('dap-an.csv',       csvContent,            { binary: false });

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'de-thi-offline.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleGenerateExam = () => {
    setShowGeneratorConfig(true);
  };

  const executeGenerateExam = () => {
    const mcqs = questions.filter(q => getQuestionType(q) === 'mcq');
    const msqs = questions.filter(q => getQuestionType(q) === 'msq');
    const sas = questions.filter(q => getQuestionType(q) === 'sa');
    if (mcqs.length < genMcqCount || msqs.length < genMsqCount || sas.length < genSaCount) {
      alert(`Không đủ câu hỏi! Cần ${genMcqCount} MCQ, ${genMsqCount} MSQ, ${genSaCount} SA. Có: ${mcqs.length} MCQ, ${msqs.length} MSQ, ${sas.length} SA.`);
      return;
    }
    const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());
    setGeneratedExam([...shuffle(mcqs).slice(0, genMcqCount), ...shuffle(msqs).slice(0, genMsqCount), ...shuffle(sas).slice(0, genSaCount)]);
    setShowGeneratorConfig(false);
    setIsGenerating(true);
  };

  const handleReplaceQuestion = (index: number) => {
    if (!generatedExam) return;
    const type = getQuestionType(generatedExam[index]);
    const pool = questions.filter(q => getQuestionType(q) === type && !generatedExam.some(gq => gq.id === q.id));
    if (!pool.length) { alert('Không còn câu khác cùng loại!'); return; }
    const newExam = [...generatedExam];
    newExam[index] = pool[Math.floor(Math.random() * pool.length)];
    setGeneratedExam(newExam);
  };

  const handleSaveExam = async () => {
    if (!examName.trim()) { alert('Vui lòng nhập tên đề!'); return; }
    if (!generatedExam?.length) return;
    setIsSavingExam(true);
    try {
      const res = await fetch('/api/admin/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examName: examName.trim(), questionIds: generatedExam.map(q => q.id) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Tạo đề "${examName.trim()}" thành công!`);
        setIsGenerating(false); setGeneratedExam(null); setExamName('');
        fetch('/api/admin/exams').then(r => r.json()).then(d => setExamPapers(d.data || []));
      } else alert('Lỗi: ' + data.error);
    } catch { alert('Có lỗi xảy ra khi lưu đề'); }
    finally { setIsSavingExam(false); }
  };

  const handleDeleteExamPaper = async (id: string, name: string) => {
    if (!confirm(`Xóa đề "${name}"?`)) return;
    const res = await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
    if (res.ok) setExamPapers(prev => prev.filter(p => p.id !== id));
    else alert('Có lỗi khi xóa đề');
  };

  const openEditPaper = async (paper: typeof examPapers[0]) => {
    setEditingPaper(paper);
    setEditPaperName(paper.name);
    setEditPaperQuestionIds(paper.question_ids || []);
    setEditPaperQuestions([]);
    setIsLoadingPaperQs(true);
    try {
      const res = await fetch(`/api/admin/exams/${paper.id}`);
      const data = await res.json();
      if (res.ok && data.questions) {
        setEditPaperQuestions(data.questions);
      }
    } catch {}
    finally { setIsLoadingPaperQs(false); }
  };

  const handleRemoveQuestionFromPaper = (qId: string) => {
    setEditPaperQuestionIds(prev => prev.filter(id => id !== qId));
    setEditPaperQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const handleSavePaper = async () => {
    if (!editingPaper) return;
    if (!editPaperName.trim()) { alert('Vui lòng nhập tên đề!'); return; }
    setIsSavingPaper(true);
    try {
      const res = await fetch(`/api/admin/exams/${editingPaper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editPaperName.trim(), question_ids: editPaperQuestionIds }),
      });
      if (res.ok) {
        setExamPapers(prev => prev.map(p =>
          p.id === editingPaper.id
            ? { ...p, name: editPaperName.trim(), question_ids: editPaperQuestionIds }
            : p
        ));
        setEditingPaper(null);
        alert('Cập nhật đề thành công!');
      } else {
        const d = await res.json();
        alert('Lỗi: ' + d.error);
      }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setIsSavingPaper(false); }
  };

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const deCount: Record<string, number> = {};
    questions.forEach(q => {
      const type = getQuestionType(q);
      typeCount[type] = (typeCount[type] || 0) + 1;
      deCount[q.de_id] = (deCount[q.de_id] || 0) + 1;
    });
    return { typeCount, deCount, total: questions.length };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    setCurrentPage(1);
    return questions.filter(q => {
      const type = getQuestionType(q);
      const matchType = filterType === 'all' || type === filterType;
      const matchDe = filterDe === 'all' || q.de_id === filterDe;
      const matchClassification = filterClassification === 'all' || q.metadata?.dang_toan === filterClassification;
      const matchSearch = searchTerm === '' ||
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.de_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.metadata?.dang_toan || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchDe && matchSearch && matchClassification;
    });
  }, [questions, filterType, filterDe, filterClassification, searchTerm]);

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  const pagedQuestions = filteredQuestions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const uniqueDe = useMemo(() => Array.from(new Set(questions.map(q => q.de_id))).sort(), [questions]);

  const uniqueClassifications = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      const c = q.metadata?.dang_toan;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [questions]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const renderMath = async () => {
        try {
          // @ts-expect-error - No types available for auto-render.js
          const renderMathInElement = (await import('katex/dist/contrib/auto-render.js')).default;
          document.querySelectorAll('.math-content').forEach(el => {
            renderMathInElement(el, {
              delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
              throwOnError: false,
              strict: false,
            });
          });
        } catch {}
      };
      renderMath();
    }
  }, [pagedQuestions, expandedId, showSolution, generatedExam, isGenerating]);

  // JSON parse on textarea change
  const handleJsonTextChange = (val: string) => {
    setJsonText(val);
    if (!val.trim()) { setJsonParseResult(null); return; }
    try {
      const parsed = JSON.parse(val);
      if (!parsed.title || !Array.isArray(parsed.questions)) {
        setJsonParseResult({ valid: false, error: 'JSON cần có trường "title" và mảng "questions".' });
      } else {
        setJsonParseResult({ valid: true, title: parsed.title, count: parsed.questions.length });
      }
    } catch (e: any) {
      setJsonParseResult({ valid: false, error: 'JSON không hợp lệ: ' + e.message });
    }
  };

  const handleImportJson = async () => {
    if (!jsonParseResult?.valid || !jsonText.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/questions/import-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonText,
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Đã nhập thành công ${data.inserted} câu hỏi vào ngân hàng của bạn!`);
        setShowJsonImport(false);
        setJsonText('');
        setJsonParseResult(null);
        // Reload questions
        const r = await fetch('/api/admin/questions');
        const d = await r.json();
        if (d.data) setQuestions(d.data);
      } else {
        alert('❌ Lỗi: ' + data.error);
      }
    } catch {
      alert('Có lỗi kết nối, vui lòng thử lại.');
    } finally {
      setIsImporting(false);
    }
  };

  // Teacher: redeem access code
  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    setRedeemMsg(null);
    try {
      const res = await fetch('/api/admin/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemMsg({ ok: true, text: data.message || '✅ Kích hoạt thành công!' });
        setGrantActivated(true);
        setRedeemCode('');
        // Reload page to fetch admin questions
        setTimeout(() => router.refresh(), 1500);
      } else {
        setRedeemMsg({ ok: false, text: data.error || 'Có lỗi xảy ra.' });
      }
    } catch {
      setRedeemMsg({ ok: false, text: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Admin: generate a new access code
  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newCodeDesc.trim(), max_uses: parseInt(newCodeMaxUses) || 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccessCodes(prev => [data.data, ...prev]);
        setNewCodeDesc('');
        setNewCodeMaxUses('1');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Admin: toggle code active
  const handleToggleCode = async (id: string, currentActive: boolean) => {
    const res = await fetch(`/api/admin/access-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    if (res.ok) {
      setAccessCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c));
    }
  };

  // Admin: delete a code
  const handleDeleteCode = async (id: string) => {
    if (!confirm('Xóa mã này?')) return;
    const res = await fetch(`/api/admin/access-codes/${id}`, { method: 'DELETE' });
    if (res.ok) setAccessCodes(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isAdmin ? '⚙️ Admin Dashboard' : '👨‍🏫 Bảng điều khiển Giáo viên'}</h1>
          <p className={styles.subtitle}>
            {isTeacher
              ? (grantActivated ? '✅ Đang dùng ngân hàng Admin + câu hỏi của bạn' : 'Ngân hàng câu hỏi cá nhân của bạn')
              : 'Quản lý toàn bộ ngân hàng câu hỏi'}
          </p>
        </div>
        <div className={styles.userInfo}>
          <span className={isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeTeacher}>
            {isAdmin ? '👑 Admin' : '👨‍🏫 Giáo viên'}
          </span>
          <span className={styles.userEmail}>{userEmail}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>Đăng xuất</button>
        </div>
      </header>

      {/* Tabs navigation */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tổng quan & Đề thi đã tạo
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'questions' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          📚 Liệt kê câu hỏi & Tạo đề
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className={styles.statsGrid}>
            {[
              { icon: '📊', value: stats.total, label: 'Tổng câu hỏi' },
              { icon: '📝', value: stats.typeCount.mcq || 0, label: 'Trắc nghiệm (MCQ)' },
              { icon: '✅', value: stats.typeCount.msq || 0, label: 'Đúng - sai (MSQ)' },
              { icon: '✏️', value: stats.typeCount.sa || 0, label: 'Trả lời ngắn (SA)' },
              { icon: '📋', value: examPapers.length, label: 'Đề thi đã tạo' },
              ...(isAdmin ? [{ icon: '👨‍🏫', value: totalTeachers, label: 'Giáo viên đăng ký' }] : []),
              ...(isTeacher ? [{ icon: '📁', value: questions.length, label: 'Câu hỏi của tôi' }] : []),
            ].map((s, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statIcon}>{s.icon}</div>
                <div>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {examPapers.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', marginBottom: '1rem' }}>
                ✨ Đề thi đã tạo ({examPapers.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {examPapers.map(paper => (
                  <div key={paper.id} style={{ background: 'white', borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📋</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1a202c' }}>{paper.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                          {(paper.question_ids || []).length} câu hỏi 
                          {paper.created_by_email && ` • 👨‍🏫 ${paper.created_by_email}`}
                          {paper.view_count !== undefined && ` • 👁️ ${paper.view_count} lượt xem`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <a href={`/${paper.slug || encodeURIComponent(paper.name)}`} target="_blank" style={{ padding: '0.5rem 1rem', background: '#667eea', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>🔗 Xem đề</a>
                      <button onClick={() => openEditPaper(paper)} style={{ padding: '0.5rem 0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }} title="Sửa đề">✏️ Sửa</button>
                      <button onClick={() => handleDeleteExamPaper(paper.id, paper.name)} style={{ padding: '0.5rem 0.75rem', background: '#fed7d7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }} title="Xóa đề">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHER: Promo banner + redeem code */}
          {isTeacher && (
            <div className={styles.promoSection}>
              {!grantActivated ? (
                <>
                  <div className={styles.promoBanner}>
                    <div className={styles.promoIcon}>🏆</div>
                    <div className={styles.promoContent}>
                      <div className={styles.promoTitle}>Nâng cấp ngân hàng câu hỏi của bạn!</div>
                      <div className={styles.promoDesc}>
                        Bạn cần ngân hàng câu hỏi toán <strong>Ôn thi TN THPT 2017 – ĐGNL – VSAT</strong>?<br/>
                        Liên hệ Admin: <a href="mailto:thaydo.net@gmail.com" className={styles.promoLink}>thaydo.net@gmail.com</a> &nbsp;—&nbsp;
                        Có hơn <strong>2.000 câu hỏi</strong> &amp; <strong>100 đề Toán 2026</strong> sẵn sàng sử dụng!
                      </div>
                    </div>
                  </div>
                  <div className={styles.redeemBox}>
                    <div className={styles.redeemTitle}>🔑 Đã có mã kích hoạt? Nhập vào đây:</div>
                    <div className={styles.redeemRow}>
                      <input
                        className={styles.redeemInput}
                        placeholder="VD: ABCD-EFGH-1234"
                        value={redeemCode}
                        onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
                        maxLength={14}
                        spellCheck={false}
                      />
                      <button
                        className={styles.redeemBtn}
                        onClick={handleRedeemCode}
                        disabled={isRedeeming || !redeemCode.trim()}
                      >
                        {isRedeeming ? '⏳ Đang xác thực...' : '🚀 Kích hoạt'}
                      </button>
                    </div>
                    {redeemMsg && (
                      <div className={redeemMsg.ok ? styles.redeemSuccess : styles.redeemError}>
                        {redeemMsg.text}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.grantActiveBanner}>
                  <span style={{ fontSize: '1.5rem' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#276749' }}>Ngân hàng Admin đã được kích hoạt!</div>
                    <div style={{ fontSize: '0.85rem', color: '#38a169', marginTop: '0.2rem' }}>
                      Bạn đang sử dụng hơn 2.000 câu hỏi từ ngân hàng của Admin cùng câu hỏi cá nhân.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADMIN: Access Code Management */}
          {isAdmin && (
            <div className={styles.codeManagerSection}>
              <h2 className={styles.codeManagerTitle}>🔑 Quản lý mã truy cập</h2>
              <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '1rem' }}>
                Tạo mã và gửi cho giáo viên để họ kích hoạt quyền dùng ngân hàng của bạn.
              </p>
              <div className={styles.codeGenRow}>
                <input
                  className={styles.codeDescInput}
                  placeholder="Ghi chú (tên GV, mục đích...)"
                  value={newCodeDesc}
                  onChange={e => setNewCodeDesc(e.target.value)}
                />
                <select
                  className={styles.codeUsesSelect}
                  value={newCodeMaxUses}
                  onChange={e => setNewCodeMaxUses(e.target.value)}
                >
                  <option value="1">1 lần dùng</option>
                  <option value="5">5 lần</option>
                  <option value="10">10 lần</option>
                  <option value="50">50 lần</option>
                  <option value="999">Không giới hạn</option>
                </select>
                <button
                  className={styles.genCodeBtn}
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? '⏳ Đang tạo...' : '✨ Tạo mã mới'}
                </button>
              </div>
              {accessCodes.length > 0 ? (
                <div className={styles.codeList}>
                  {accessCodes.map(c => (
                    <div key={c.id} className={`${styles.codeItem} ${!c.is_active ? styles.codeItemInactive : ''}`}>
                      <div className={styles.codeValue}>
                        <code>{c.code}</code>
                        <button
                          className={styles.codeCopyBtn}
                          onClick={() => { navigator.clipboard.writeText(c.code); }}
                          title="Sao chép mã"
                        >📋</button>
                      </div>
                      <div className={styles.codeMeta}>
                        <span>{c.description || '—'}</span>
                        <span className={styles.codeUsage}>{c.used_count}/{c.max_uses === 999 ? '∞' : c.max_uses} lần dùng</span>
                        <span className={c.is_active ? styles.codeActive : styles.codeInactive}>
                          {c.is_active ? '● Hoạt động' : '○ Đã tắt'}
                        </span>
                      </div>
                      <div className={styles.codeActions}>
                        <button
                          className={styles.codeToggleBtn}
                          onClick={() => handleToggleCode(c.id, c.is_active)}
                        >
                          {c.is_active ? '🔴 Tắt' : '🟢 Bật'}
                        </button>
                        <button
                          className={styles.codeDeleteBtn}
                          onClick={() => handleDeleteCode(c.id)}
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a0aec0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem' }}>
                  Chưa có mã nào. Tạo mã đầu tiên để gửi cho giáo viên!
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'questions' && (
        <>
          <div className={styles.filters}>
        <input type="text" placeholder="Tìm kiếm câu hỏi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={styles.searchInput} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={styles.select}>
          <option value="all">Tất cả loại</option>
          <option value="mcq">Trắc nghiệm (MCQ)</option>
          <option value="msq">Đúng - sai (MSQ)</option>
          <option value="sa">Trả lời ngắn (SA)</option>
        </select>
        <select value={filterDe} onChange={e => setFilterDe(e.target.value)} className={styles.select}>
          <option value="all">Tất cả đề</option>
          {uniqueDe.map(de => <option key={de} value={de}>{de}</option>)}
        </select>
        <select value={filterClassification} onChange={e => setFilterClassification(e.target.value)} className={styles.select} style={{ maxWidth: '240px' }}>
          <option value="all">Tất cả phân loại</option>
          {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isTeacher && (
        <div className={styles.infoBoxTeacher}>
          📌 Đây là ngân hàng câu hỏi cá nhân của bạn. Nhập JSON để thêm câu hỏi mới, sau đó chọn câu hỏi để tạo đề thi.
        </div>
      )}

      <div className={styles.results}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p className={styles.resultCount} style={{ margin: 0 }}>
              Hiển thị {filteredQuestions.length} / {stats.total} câu hỏi
              {totalPages > 1 && ` — Trang ${currentPage}/${totalPages}`}
            </p>
            {filteredQuestions.length > 0 && (
              <button
                className={styles.selectAllBtn}
                onClick={() => {
                  const allFilteredIds = filteredQuestions.map(q => q.id);
                  const allSelected = allFilteredIds.every(id => selectedIds.has(id));
                  if (allSelected) {
                    // Deselect all filtered
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      allFilteredIds.forEach(id => next.delete(id));
                      return next;
                    });
                  } else {
                    // Select all filtered
                    setSelectedIds(prev => new Set([...prev, ...allFilteredIds]));
                  }
                }}
              >
                {filteredQuestions.every(q => selectedIds.has(q.id))
                  ? `☑ Bỏ chọn tất cả (${filteredQuestions.length})`
                  : `☐ Chọn tất cả (${filteredQuestions.length})`}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className={styles.importJsonBtn}
              onClick={() => setShowJsonImport(true)}
            >
              📥 Nhập câu hỏi từ JSON
            </button>
            <button onClick={handleGenerateExam} className={styles.generateBtn}>
              ✨ Tạo đề ngẫu nhiên
            </button>
          </div>
        </div>
      </div>

      <div className={styles.questionList}>
        {pagedQuestions.map(q => (
          <div key={q.id} className={`${styles.questionCard} ${selectedIds.has(q.id) ? styles.questionCardSelected : ''}`}>
            <div className={styles.questionHeader}>
              <div className={styles.questionMeta}>
                <input
                  type='checkbox'
                  className={styles.questionCheckbox}
                  checked={selectedIds.has(q.id)}
                  onChange={() => toggleSelect(q.id)}
                  title='Chọn câu hỏi này'
                />
                <span className={styles.badge}>{q.de_id}</span>
                <span className={styles.badge}>Câu {q.so_cau}</span>
                <span className={`${styles.badge} ${styles[getQuestionType(q)]}`}>{getQuestionType(q).toUpperCase()}</span>
                {q.metadata?.dang_toan && (
                  <span className={styles.badge} style={{ background: '#e2e8f0', color: '#4a5568', fontWeight: 600 }}>
                    🏷️ {q.metadata.dang_toan}
                  </span>
                )}
              </div>
              <div className={styles.actions}>
                {isAdmin && <button onClick={() => openEdit(q)} className={styles.saveEditBtn} title="Sửa câu hỏi">✏️ Sửa</button>}
                <button onClick={() => setExpandedId(expandedId === q.id ? null : q.id)} className={styles.editBtn} title="Xem chi tiết">
                  {expandedId === q.id ? '▲' : '▼'}
                </button>
                {/* Admin: delete any; Teacher: only delete own questions */}
                {(isAdmin || (isTeacher && (q as any).created_by)) && (
                  <button onClick={() => handleDelete(q.id)} className={styles.deleteBtn} title="Xóa">🗑️</button>
                )}
              </div>
            </div>

            <div className={`${styles.questionContent} math-content`} style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: q.content }} />

            {expandedId === q.id && mounted && (
              <div className={styles.questionDetails}>
                <div className={styles.detailSection}>
                  <strong>Nội dung đầy đủ:</strong>
                  <div className="math-content" dangerouslySetInnerHTML={{ __html: q.content }} />
                </div>
                {q.options && (
                  <div className={styles.detailSection}>
                    <strong>Các đáp án:</strong>
                    <div className={styles.optionsList}>
                      {Object.entries(q.options).map(([key, value]) => (
                        <div key={key} className={styles.optionItem}>
                          <span className={styles.optionLabel}>{key}.</span>
                          <span className="math-content" dangerouslySetInnerHTML={{ __html: String(value) }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {q.answer && (
                  <div className={styles.detailSection}>
                    <strong>Đáp án đúng:</strong> <span className={styles.correctAnswer}>{q.answer}</span>
                  </div>
                )}
                {q.image_url && (
                  <div className={styles.detailSection}>
                    <strong>Hình ảnh:</strong>
                    <img src={q.image_url} alt="Question" className={styles.questionImage} />
                  </div>
                )}
                {(q.explanation || q.metadata?.explanation || q.metadata?.loi_giai) && (() => {
                  const sol = q.explanation || q.metadata?.explanation || q.metadata?.loi_giai;
                  return (
                    <div className={styles.detailSection}>
                      <div className={styles.solutionHeader}>
                        <strong>💡 Lời giải:</strong>
                        <button onClick={() => toggleSolution(q.id)} className={styles.toggleBtn}>{showSolution[q.id] ? '▲ Ẩn' : '▼ Hiện'}</button>
                      </div>
                      {showSolution[q.id] && <div className={`${styles.solutionContent} math-content`} dangerouslySetInnerHTML={{ __html: sol }} />}
                    </div>
                  );
                })()}
                {q.metadata && (
                  <div className={styles.detailSection}>
                    <strong>Thông tin bổ sung:</strong>
                    <div className={styles.metadataGrid}>
                      {q.metadata.difficulty && <div><strong>Độ khó:</strong> {q.metadata.difficulty}</div>}
                      {q.metadata.grade && <div><strong>Lớp:</strong> {q.metadata.grade}</div>}
                      {q.metadata.chapter && <div><strong>Chương:</strong> {q.metadata.chapter}</div>}
                      {q.metadata.concept && <div><strong>Khái niệm:</strong> {q.metadata.concept}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
          <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .reduce<(number | string)[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...'
                ? <span key={`dots-${i}`} className={styles.pageDots}>…</span>
                : <button key={p} className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`} onClick={() => setCurrentPage(p as number)}>{p}</button>
            )}
          <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
          <button className={styles.pageBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      )}
        </>
      )}

      {/* Edit Exam Paper Modal */}
      {editingPaper && (
        <div className={styles.generatorOverlay} onClick={e => { if (e.target === e.currentTarget) setEditingPaper(null); }}>
          <div className={styles.editModal} style={{ maxWidth: '860px' }}>
            <div className={styles.generatorHeader}>
              <h2>✏️ Sửa đề thi</h2>
              <button onClick={() => setEditingPaper(null)} className={styles.closeBtn}>&times;</button>
            </div>
            <div className={styles.editModalBody}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Tên đề thi</label>
                <input
                  className={styles.editInput}
                  value={editPaperName}
                  onChange={e => setEditPaperName(e.target.value)}
                  placeholder="Nhập tên đề..."
                />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>
                  Danh sách câu hỏi ({editPaperQuestionIds.length} câu)
                </label>
                {isLoadingPaperQs ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#718096' }}>⏳ Đang tải câu hỏi...</div>
                ) : editPaperQuestions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {editPaperQuestions.map((q, idx) => (
                      <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ minWidth: '32px', fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>#{idx + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ padding: '0.15rem 0.5rem', background: '#edf2f7', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>{q.de_id}</span>
                            <span style={{ padding: '0.15rem 0.5rem', background: '#edf2f7', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>Câu {q.so_cau}</span>
                            <span style={{ padding: '0.15rem 0.5rem', background: getQuestionType(q) === 'mcq' ? '#bee3f8' : getQuestionType(q) === 'msq' ? '#c6f6d5' : '#fed7d7', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: getQuestionType(q) === 'mcq' ? '#2c5282' : getQuestionType(q) === 'msq' ? '#22543d' : '#742a2a' }}>{getQuestionType(q).toUpperCase()}</span>
                          </div>
                          <div className="math-content" style={{ fontSize: '0.875rem', color: '#2d3748', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} dangerouslySetInnerHTML={{ __html: q.content }} />
                        </div>
                        <button
                          onClick={() => handleRemoveQuestionFromPaper(q.id)}
                          style={{ padding: '0.35rem 0.6rem', background: '#fed7d7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#c53030', flexShrink: 0 }}
                          title="Xóa câu này khỏi đề"
                        >🗑️</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#a0aec0', fontSize: '0.875rem' }}>Không có câu hỏi nào trong đề</div>
                )}
              </div>
            </div>
            <div className={styles.editModalFooter}>
              <span style={{ fontSize: '0.875rem', color: '#718096', marginRight: 'auto' }}>
                {editPaperQuestionIds.length} câu hỏi
              </span>
              <button onClick={() => setEditingPaper(null)} className={styles.cancelBtn}>Hủy</button>
              <button onClick={handleSavePaper} className={styles.saveBtn} disabled={isSavingPaper || !editPaperName.trim()}>
                {isSavingPaper ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQ && (
        <div className={styles.generatorOverlay} onClick={e => { if (e.target === e.currentTarget) setEditingQ(null); }}>
          <div className={styles.editModal}>
            <div className={styles.generatorHeader}>
              <h2>✏️ Sửa câu hỏi — {editingQ.de_id} / Câu {editingQ.so_cau}</h2>
              <button onClick={() => setEditingQ(null)} className={styles.closeBtn}>&times;</button>
            </div>
            <div className={styles.editModalBody}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Nội dung câu hỏi</label>
                <textarea className={styles.editTextarea} rows={5} value={editForm.content || ''} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Đáp án đúng</label>
                <input className={styles.editInput} value={editForm.answer || ''} onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))} />
              </div>
              {editForm.options && Object.keys(editForm.options).length > 0 && (
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Các lựa chọn</label>
                  {Object.entries(editForm.options).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <span style={{ minWidth: '80px', fontWeight: 600, color: '#667eea' }}>{key}:</span>
                      <input className={styles.editInput} value={String(val)} onChange={e => setEditForm(f => ({ ...f, options: { ...f.options, [key]: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.editField}>
                <label className={styles.editLabel}>URL hình ảnh</label>
                <input className={styles.editInput} value={editForm.image_url || ''} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
                {editForm.image_url && <img src={editForm.image_url} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '0.5rem', borderRadius: '8px', objectFit: 'contain' }} />}
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Dạng toán (metadata → <code>dang_toan</code>)</label>
                <input
                  className={styles.editInput}
                  value={(editForm.metadata as any)?._editDangToan || ''}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    metadata: { ...(f.metadata as any), _editDangToan: e.target.value },
                  }))}
                  placeholder="VD: Hàm số, Tích phân, Xác suất..."
                />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Lời giải (metadata → <code>explanation</code>)</label>
                <textarea
                  className={styles.editTextarea}
                  rows={6}
                  value={(editForm.metadata as any)?._editExplanation || ''}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    metadata: { ...(f.metadata as any), _editExplanation: e.target.value },
                  }))}
                />
              </div>
            </div>
            <div className={styles.editModalFooter}>
              <button onClick={() => setEditingQ(null)} className={styles.cancelBtn}>Hủy</button>
              <button onClick={handleSaveEdit} className={styles.saveBtn} disabled={isSavingEdit}>
                {isSavingEdit ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showJsonImport && (
        <div className={styles.jsonImportOverlay} onClick={e => { if (e.target === e.currentTarget) setShowJsonImport(false); }}>
          <div className={styles.jsonImportModal}>
            <div className={styles.jsonImportHeader}>
              <h2>📥 Nhập câu hỏi từ JSON</h2>
              <button onClick={() => setShowJsonImport(false)} className={styles.closeBtn}>&times;</button>
            </div>
            <div className={styles.jsonImportBody}>
              <div className={styles.infoBox}>
                <strong>Định dạng JSON hợp lệ:</strong> Cần có <code>"title"</code> (tên đề) và <code>"questions"</code> (mảng câu hỏi). Mỗi câu hỏi cần có <code>type</code> (<code>mcq</code> / <code>msq</code> / <code>sa</code> / <code>tl</code>), <code>question</code>, <code>correct_option</code>. MCQ/MSQ cần thêm <code>option_a</code>–<code>option_d</code>.
              </div>
              <textarea
                className={styles.jsonTextarea}
                placeholder={`Dán JSON vào đây...\n\nVí dụ:\n${SAMPLE_JSON}`}
                value={jsonText}
                onChange={e => handleJsonTextChange(e.target.value)}
                spellCheck={false}
              />
              {jsonParseResult && (
                jsonParseResult.valid ? (
                  <div className={styles.jsonPreview}>
                    ✅ <strong>Hợp lệ!</strong>&nbsp;Tên đề: <em>"{jsonParseResult.title}"</em> — Số câu hỏi: <strong>{jsonParseResult.count}</strong>
                  </div>
                ) : (
                  <div className={styles.jsonError}>
                    ❌ {jsonParseResult.error}
                  </div>
                )
              )}
            </div>
            <div className={styles.jsonImportFooter}>
              <button
                className={styles.jsonSampleBtn}
                onClick={() => handleJsonTextChange(SAMPLE_JSON)}
              >
                📄 Dùng JSON mẫu
              </button>
              <button
                onClick={() => { setShowJsonImport(false); setJsonText(''); setJsonParseResult(null); }}
                className={styles.cancelBtn}
              >
                Hủy
              </button>
              <button
                className={styles.jsonImportSubmitBtn}
                onClick={handleImportJson}
                disabled={!jsonParseResult?.valid || isImporting}
              >
                {isImporting ? '⏳ Đang nhập...' : '💾 Lưu vào ngân hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Config Modal */}
      {showGeneratorConfig && (
        <div className={styles.generatorOverlay} onClick={e => { if (e.target === e.currentTarget) setShowGeneratorConfig(false); }}>
          <div className={styles.generatorModal} style={{ maxWidth: '400px' }}>
            <div className={styles.generatorHeader}>
              <h2>Cấu hình đề ngẫu nhiên</h2>
              <button onClick={() => setShowGeneratorConfig(false)} className={styles.closeBtn}>&times;</button>
            </div>
            <div className={styles.editModalBody}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Số câu Trắc nghiệm (MCQ)</label>
                <input type="number" min="0" className={styles.editInput} value={genMcqCount} onChange={e => setGenMcqCount(parseInt(e.target.value) || 0)} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Số câu Đúng - sai (MSQ)</label>
                <input type="number" min="0" className={styles.editInput} value={genMsqCount} onChange={e => setGenMsqCount(parseInt(e.target.value) || 0)} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Số câu Trả lời ngắn (SA)</label>
                <input type="number" min="0" className={styles.editInput} value={genSaCount} onChange={e => setGenSaCount(parseInt(e.target.value) || 0)} />
              </div>
              <div style={{ marginTop: '1rem', color: '#4a5568', fontSize: '0.9rem' }}>
                Tổng cộng: <strong>{genMcqCount + genMsqCount + genSaCount}</strong> câu
              </div>
            </div>
            <div className={styles.editModalFooter}>
              <button onClick={() => setShowGeneratorConfig(false)} className={styles.cancelBtn}>Hủy</button>
              <button onClick={executeGenerateExam} className={styles.saveBtn}>✨ Tạo đề</button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      {isGenerating && generatedExam && (
        <div className={styles.generatorOverlay}>
          <div className={styles.generatorModal}>
            <div className={styles.generatorHeader}>
              <h2>Tạo đề mới ({generatedExam.length} câu)</h2>
              <button onClick={() => setIsGenerating(false)} className={styles.closeBtn}>&times;</button>
            </div>
            <div className={styles.generatorContent}>
              <div className={styles.questionList}>
                {generatedExam.map((q, index) => (
                  <div key={q.id + index} className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                      <div className={styles.questionMeta}>
                        <span className={styles.badge}>Câu {index + 1}</span>
                        <span className={`${styles.badge} ${styles[getQuestionType(q)]}`}>{getQuestionType(q).toUpperCase()}</span>
                        <span className={styles.badge} style={{ opacity: 0.7 }}>Gốc: {q.de_id} - Câu {q.so_cau}</span>
                      </div>
                      <div className={styles.actions}>
                        <button onClick={() => handleReplaceQuestion(index)} className={styles.replaceBtn} title="Thay câu khác">🔄 Thay câu</button>
                      </div>
                    </div>
                    <div className={`${styles.questionContent} math-content`} dangerouslySetInnerHTML={{ __html: q.content }} />
                    {q.options && (
                      <div className={styles.optionsList} style={{ marginTop: '1rem' }}>
                        {Object.entries(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map(([key, value]) => (
                          <div key={key} className={styles.optionItem}>
                            <span className={styles.optionLabel}>{key}.</span>
                            <span className="math-content" dangerouslySetInnerHTML={{ __html: String(value) }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.generatorFooter}>
              <input type="text" className={styles.examNameInput} placeholder="Nhập tên mã đề (VD: de-thi-thu-2026-moi)" value={examName} onChange={e => setExamName(e.target.value)} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleSaveExam} className={styles.onlineBtn} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }} disabled={isSavingExam || !examName.trim()}>
                  {isSavingExam ? 'Đang lưu...' : '🌐 Xuất Online'}
                </button>
                <button onClick={() => handleExportOffline(generatedExam)} className={styles.offlineBtn} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }} disabled={!generatedExam?.length}>
                  📥 Xuất Offline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom selection bar */}
      {selectionStats.total > 0 && (
        <div className={styles.selectionBar}>
          <div className={styles.selectionInfo}>
            <span className={styles.selectionTotal}>✅ Đã chọn: <strong>{selectionStats.total}</strong> câu</span>
            <span className={`${styles.selectionChip} ${styles.selectionChipMcq}`}>MCQ: <strong>{selectionStats.mcq}</strong></span>
            <span className={`${styles.selectionChip} ${styles.selectionChipMsq}`}>MSQ: <strong>{selectionStats.msq}</strong></span>
            <span className={`${styles.selectionChip} ${styles.selectionChipSa}`}>SA: <strong>{selectionStats.sa}</strong></span>
          </div>
          <div className={styles.selectionActions}>
            <button onClick={clearSelection} className={styles.clearSelBtn}>✕ Bỏ chọn</button>
            <button onClick={handleGenerateOnlineFromSelected} className={styles.onlineBtn}>
              🌐 Tạo đề Online
            </button>
            <button onClick={handleExportOffline} className={styles.offlineBtn}>
              📥 Tạo đề Offline (HTML + Word)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
