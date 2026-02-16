
import React, { useState, useRef, useCallback } from 'react';
import { AppState, EvaluationResult, BatchItem } from './types';
import { evaluateAssignment, listAvailableModels } from './geminiService';
import * as mammoth from 'mammoth';
import {
  FileUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clipboard,
  GraduationCap,
  History,
  Info,
  Type as TypeIcon,
  Trash2,
  FileText,
  ChevronRight,
  ListChecks,
  Users,
  Edit2,
  Eye,
  EyeOff,
  Key,
  ShieldAlert,
  Server
} from 'lucide-react';

const ApiKeyInput: React.FC<{ apiKey: string, setApiKey: (key: string) => void }> = ({ apiKey, setApiKey }) => {
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const checkModels = async () => {
    setLoadingModels(true);
    setModelError(null);
    setModels([]);
    try {
      const available = await listAvailableModels(apiKey);
      setModels(available);
    } catch (err: any) {
      setModelError(err.message || "Failed to list models");
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <div className="mb-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
          <Key size={20} />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Gemini API Key</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API Key..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 transition-colors"
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={checkModels}
          disabled={!apiKey || loadingModels}
          className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loadingModels ? <Loader2 size={12} className="animate-spin" /> : <Server size={12} />}
          Check Available Models
        </button>
      </div>

      {modelError && (
        <div className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
          {modelError}
        </div>
      )}

      {models.length > 0 && (
        <div className="mt-3 bg-slate-900 rounded-lg p-3 text-xs font-mono text-green-400 overflow-x-auto">
          <p className="text-slate-400 mb-2 font-sans font-bold">Available Models:</p>
          <ul className="space-y-1">
            {models.map(m => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Name Extraction Utilities ---
const getSuggestedName = (fileName: string, text?: string): string => {
  // 1. Try to find "Name: [Name]" patterns in the text
  if (text) {
    const namePatterns = [
      /(?:Name|Student|Author|Candidate|Submitted by):\s*([^\r\n,:]+)/i,
      /(?:Evaluation of|Assessment for)\s*([^\r\n,:]+)/i
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1].trim() && match[1].trim().length < 50) {
        return match[1].trim();
      }
    }
  }

  // 2. Fallback to filename analysis
  let name = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  name = name.replace(/[_-]/g, " "); // Replace separators
  // Remove common academic prefixes
  name = name.replace(/assignment|module|unit|evaluation|assessment|saïd|oxford|school|feedback/gi, "").trim();

  // Clean digits and extra whitespace
  name = name.replace(/\d+/g, "").replace(/\s+/g, " ").trim();

  if (!name) return "Unknown Student";

  // Capitalize properly
  return name.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
          <GraduationCap className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Evaluator Pro</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Oxford Saïd Batch System</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-indigo-600">Lead Evaluator</span>
          <span className="text-xs text-slate-400">Agustin Rubini</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
          AR
        </div>
      </div>
    </div>
  </header>
);

const BatchUpload: React.FC<{ onStartBatch: (items: BatchItem[]) => void, apiKey: string, setApiKey: (key: string) => void }> = ({ onStartBatch, apiKey, setApiKey }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    setIsReading(true);
    const items: BatchItem[] = [];

    for (const file of selectedFiles) {
      try {
        let text = '';
        if (file.name.toLowerCase().endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else {
          text = await file.text();
        }

        items.push({
          id: Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          status: 'pending',
          text: text,
          suggestedName: getSuggestedName(file.name, text)
        });
      } catch (err) {
        console.error(`Error reading ${file.name}`, err);
      }
    }

    setIsReading(false);
    onStartBatch(items);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Batch Evaluation</h2>
            <p className="text-slate-500 mt-3 text-lg">Upload up to 10 assignments at once.</p>
          </div>

          <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group mb-8"
          >
            <input type="file" ref={fileInputRef} multiple onChange={handleFileChange} className="hidden" accept=".docx,.txt,.md" />
            <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm border border-indigo-100">
              <FileUp className="text-indigo-600" size={40} />
            </div>
            <p className="text-slate-700 font-bold text-xl">Click or drag files here</p>
            <p className="text-slate-400 mt-2 text-sm font-medium">Supports .docx, .txt, and .md formats</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3 mb-10">
              <div className="flex justify-between items-center px-2 mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ListChecks size={14} /> Selected ({selectedFiles.length})
                </h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="text-indigo-400 flex-shrink-0" size={20} />
                      <span className="text-sm font-bold text-slate-700 truncate">{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={processFiles}
            disabled={selectedFiles.length === 0 || isReading || !apiKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg"
          >
            {isReading ? <Loader2 className="animate-spin" /> : <ChevronRight size={24} />}
            {isReading ? "Reading files..." : "Start Evaluation"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProcessingQueue: React.FC<{ items: BatchItem[] }> = ({ items }) => {
  const completedCount = items.filter(i => i.status === 'completed').length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="max-w-2xl mx-auto mt-20 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-6">
            <Loader2 className="animate-spin text-indigo-600" size={80} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Processing Batch</h2>
          <p className="text-slate-400 mt-2 font-medium">Running Ox-Saïd AI Assessment Layer</p>
        </div>

        <div className="space-y-4 text-left max-h-[400px] overflow-y-auto px-2">
          {items.map((item) => (
            <div key={item.id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${item.status === 'evaluating' ? 'bg-indigo-50 border-indigo-200' :
              item.status === 'completed' ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-100 opacity-60'
              }`}>
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`p-2 rounded-lg ${item.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                  {item.status === 'completed' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 truncate">{item.suggestedName || item.fileName}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.status === 'evaluating' ? 'Evaluating Content...' : item.status === 'completed' ? 'Ready' : 'In Queue'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BatchResults: React.FC<{ items: BatchItem[], onReset: () => void, onUpdateName: (id: string, name: string) => void }> = ({ items, onReset, onUpdateName }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const currentItem = items[activeTab];
  const [copied, setCopied] = useState(false);

  const getFullText = (item: BatchItem) => {
    if (!item.result) return '';
    return `${item.result.studentName} – Evaluation

Scores

${item.result.scores.map(s => `${s.categoryName}: ${s.score}/${s.maxScore}`).join('\n')}
Total: ${item.result.totalScore}/${item.result.maxPossible}

Feedback
${item.result.feedback}

Kind regards,
Agustin Rubini`;
  };

  const handleCopyCurrent = () => {
    if (currentItem.result?.feedback) {
      navigator.clipboard.writeText(currentItem.result.feedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAll = () => {
    const all = items.filter(i => i.result).map(getFullText).join('\n\n' + '='.repeat(40) + '\n\n');
    navigator.clipboard.writeText(all);
    alert("Batch copied to clipboard.");
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 px-4 mb-24">
      <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white flex flex-col md:flex-row justify-between items-center shadow-xl">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <div className="bg-white/10 p-4 rounded-2xl">
            <Users className="text-indigo-400" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Evaluations Complete</h2>
            <p className="text-indigo-300 font-medium">Oxford Saïd Rubrics Applied</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={handleCopyAll} className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold flex items-center justify-center gap-2 border border-white/5">
            <Clipboard size={18} /> Copy All
          </button>
          <button onClick={onReset} className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all font-bold">
            New Batch
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-80 space-y-2">
          {items.map((item, i) => (
            <button key={item.id} onClick={() => { setActiveTab(i); setShowOriginal(false); setIsEditingName(false); }}
              className={`w-full text-left p-5 rounded-2xl transition-all border flex items-center justify-between group ${activeTab === i ? 'bg-white border-indigo-200 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 text-slate-500'
                }`}>
              <div className="overflow-hidden">
                <p className={`text-sm font-bold truncate ${activeTab === i ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {item.result?.studentName || item.suggestedName || item.fileName}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {item.result ? `Grade: ${item.result.totalScore}/${item.result.maxPossible}` : 'Processing'}
                </p>
              </div>
              {activeTab === i && <ChevronRight size={18} className="text-indigo-400" />}
            </button>
          ))}
        </aside>

        <main className="flex-1">
          {currentItem.result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-indigo-50 border-b border-indigo-100 p-8 flex justify-between items-center">
                  <div className="flex-1 mr-4">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          defaultValue={currentItem.result.studentName}
                          onBlur={(e) => { onUpdateName(currentItem.id, e.target.value); setIsEditingName(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateName(currentItem.id, (e.target as HTMLInputElement).value); setIsEditingName(false); } }}
                          className="text-2xl font-bold bg-white border border-indigo-200 rounded px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                        <h2 className="text-2xl font-bold text-indigo-950">{currentItem.result.studentName}</h2>
                        <Edit2 size={16} className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest mt-1">Module {currentItem.result.moduleId} Feedback</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-indigo-900">{currentItem.result.totalScore}<span className="text-indigo-300 text-xl">/{currentItem.result.maxPossible}</span></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1">Weighted Score</p>
                  </div>
                </div>

                <div className="p-8 space-y-10">
                  <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {currentItem.result.scores.map((score, idx) => (
                        <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold text-slate-600 flex-1 pr-4">{score.categoryName}</span>
                            <span className="text-sm font-black text-indigo-600">{score.score}<span className="text-slate-300 text-[10px]">/{score.maxScore}</span></span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(score.score / score.maxScore) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Feedback Statement</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setShowOriginal(!showOriginal)} className="flex items-center gap-2 text-xs text-slate-500 font-bold hover:text-slate-700 transition-colors px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                          {showOriginal ? <EyeOff size={16} /> : <Eye size={16} />}
                          {showOriginal ? "Hide Original" : "Show Submission"}
                        </button>
                        <button onClick={handleCopyCurrent} className="flex items-center gap-2 text-xs text-indigo-600 font-bold hover:text-indigo-700 transition-colors px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                          {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Clipboard size={16} />}
                          {copied ? "Copied" : "Copy Individual"}
                        </button>
                      </div>
                    </div>
                    {showOriginal ? (
                      <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-xs leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                        {currentItem.text}
                      </div>
                    ) : (
                      <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700 text-base leading-relaxed italic font-medium">
                        {currentItem.result.feedback}
                      </div>
                    )}
                  </section>

                  {/* Bookmarklet Data Table Section */}
                  <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Data for Bookmarklet</h3>
                      <button
                        onClick={() => {
                          // Construct array: [Name, Score1, Score2, ..., ScoreN, Feedback]
                          const dataToExport = [
                            currentItem.result.studentName,
                            ...currentItem.result.scores.map(s => s.score),
                            currentItem.result.feedback
                          ];
                          const jsonString = JSON.stringify(dataToExport);
                          localStorage.setItem('studentData', jsonString);

                          navigator.clipboard.writeText(jsonString).then(() => {
                            alert(`Data for ${currentItem.result.studentName} copied to CLIPBOARD! \n\nYou can now go to Moodle, click the bookmarklet, and paste.`);
                          }).catch(err => {
                            console.error('Failed to copy: ', err);
                            alert("Failed to copy to clipboard. Please copy manually from the table below.");
                          });
                        }}
                        className="flex items-center gap-2 text-xs text-indigo-600 font-bold hover:text-indigo-700 transition-colors px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100"
                      >
                        <TypeIcon size={16} /> Copy for Form
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-100/50">
                          <tr>
                            <th className="px-4 py-3 rounded-l-lg">Name</th>
                            {currentItem.result.scores.map((s, i) => (
                              <th key={i} className="px-4 py-3">S{i + 1}: {s.categoryName.split(' ')[0]}...</th>
                            ))}
                            <th className="px-4 py-3 rounded-r-lg">Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white border-b border-slate-100">
                            <td className="px-4 py-3 font-bold text-slate-800">{currentItem.result.studentName}</td>
                            {currentItem.result.scores.map((s, i) => (
                              <td key={i} className="px-4 py-3 font-mono text-indigo-600">{s.score}</td>
                            ))}
                            <td className="px-4 py-3 italic text-slate-400 truncate max-w-xs">{currentItem.result.feedback.substring(0, 50)}...</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="mt-3 text-[10px] text-slate-400">
                        * This table shows the exact data that will be available to your bookmarklet.
                        Array Format: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">[Name, Score 1...N, Feedback]</code>
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center flex flex-col items-center">
              <AlertCircle className="text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-bold">Failed to evaluate this entry.</p>
              {currentItem.error && <p className="text-red-500 text-sm mt-2">{currentItem.error}</p>}
            </div>
          )
          }
        </main >
      </div >
    </div >
  );
};

const PasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem("app_auth") === "true");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Bronze89") {
      setIsAuthenticated(true);
      sessionStorage.setItem("app_auth", "true");
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldAlert className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Restricted Access</h1>
          <p className="text-slate-500 text-sm mt-2">Oxford Saïd Evaluation Engine</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Access Code</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800"
              placeholder="Enter password..."
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle size={14} />
              Incorrect access code
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            Enter System
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PasswordGate>
      <AppContent />
    </PasswordGate>
  );
}

function AppContent() {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");

  React.useEffect(() => {
    localStorage.setItem("gemini_api_key", apiKey);
  }, [apiKey]);

  const processBatch = useCallback(async (items: BatchItem[]) => {
    setBatchItems(items);
    setState(AppState.PROCESSING_BATCH);
    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      updatedItems[i] = { ...item, status: 'evaluating' };
      setBatchItems([...updatedItems]);

      try {
        if (!item.text) throw new Error("Empty file content");
        const evaluation = await evaluateAssignment(item.text, item.fileName, apiKey, item.suggestedName);
        updatedItems[i] = { ...updatedItems[i], status: 'completed', result: evaluation };
      } catch (err: any) {
        updatedItems[i] = { ...updatedItems[i], status: 'error', error: err.message };
      }
      setBatchItems([...updatedItems]);
    }
    setState(AppState.RESULTS);
  }, [apiKey]);

  const handleUpdateName = (id: string, newName: string) => {
    setBatchItems(prev => prev.map(item => {
      if (item.id === id && item.result) {
        return { ...item, result: { ...item.result, studentName: newName } };
      }
      return item;
    }));
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setBatchItems([]);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-12 bg-[#f8f9fc]">
      <Header />
      <main className="container mx-auto">
        {state === AppState.IDLE && <BatchUpload onStartBatch={processBatch} apiKey={apiKey} setApiKey={setApiKey} />}
        {state === AppState.PROCESSING_BATCH && <ProcessingQueue items={batchItems} />}
        {state === AppState.RESULTS && <BatchResults items={batchItems} onReset={handleReset} onUpdateName={handleUpdateName} />}
        {state === AppState.ERROR && (
          <div className="max-w-xl mx-auto mt-20 p-10 bg-white border border-red-100 rounded-3xl shadow-2xl text-center">
            <div className="bg-red-50 p-5 rounded-full w-fit mx-auto mb-6"><AlertCircle className="text-red-500" size={56} /></div>
            <h2 className="text-2xl font-bold text-slate-800">System Error</h2>
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mt-6 text-sm font-medium">{error}</div>
            <button onClick={handleReset} className="mt-8 w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800">Restart</button>
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-t border-slate-200 p-4 flex justify-center z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">&copy; 2024 Oxford Saïd Business School Evaluation Engine | Agustin Rubini System v1.1</p>
      </footer>
    </div>
  );
}
