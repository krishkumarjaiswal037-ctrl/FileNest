import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Video,
  Bot,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Film,
  Download,
  AlertCircle,
  HelpCircle,
  Code,
  GraduationCap,
  Briefcase,
  Zap,
  Sliders,
  Play,
  Share2
} from 'lucide-react';

const CHAT_ROLES = [
  {
    id: 'professor',
    title: 'CS Professor & Core Theory',
    badge: 'Deep Theory',
    icon: GraduationCap,
    instruction:
      'You are a distinguished Professor of Computer Science. Explain core computer science concepts (Operating Systems, DBMS, Computer Networks, Theory of Computation, Algorithms) with clear academic rigor, diagrams described in text, step-by-step logic, and real-world engineering examples.'
  },
  {
    id: 'debugger',
    title: 'Code Coach & Debugger',
    badge: 'Coding & DSA',
    icon: Code,
    instruction:
      'You are an expert Senior Software Engineer and competitive programmer. Provide clean, well-commented code in C, C++, Java, or Python. Explain time and space complexity (Big-O), edge cases, and best practices.'
  },
  {
    id: 'placement',
    title: 'Interview & Placement Mentor',
    badge: 'Career & Prep',
    icon: Briefcase,
    instruction:
      'You are an engineering campus placement and tech interview mentor. Help students master DSA interview questions, behavioral questions, company-specific online assessment patterns, and resume tips.'
  },
  {
    id: 'fast',
    title: 'Fast Study Buddy',
    badge: 'Speed & Summaries',
    icon: Zap,
    instruction:
      'You are a quick and concise study partner. Answer questions directly in crisp bullet points, key definitions, and quick revision notes without fluff.'
  }
];

const MODEL_OPTIONS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Recommended',
    description: 'Balanced speed and intelligence for general academic tasks'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Ultra-Fast',
    description: 'Instant responses for quick Q&A and definition lookups'
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    tag: 'Paid Key',
    description: 'Deep reasoning for advanced algorithms and math (Requires billing key)'
  }
];

const VIDEO_STARTER_PROMPTS = [
  'A 3D cinematic animation of data packets flowing through an internet router and optical fiber cables',
  'Animated visualization of a Binary Search Tree balancing itself during node insertion',
  'A microscopic view of electrons flowing through a silicon microprocessor transistor gate',
  'A modern conceptual visualization of distributed database nodes syncing state across global cloud regions'
];

export default function AiStudio({ notify }) {
  // Navigation between the two features: 'chat' (Gemini Chatbot) and 'video' (Veo 3 Video Generator)
  const [activeTab, setActiveTab] = useState('chat');

  // ==========================================
  // FEATURE 1: GEMINI MULTI-TURN CHATBOT STATE
  // ==========================================
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      content:
        "Hello! I'm your AI Academic Assistant powered by Google Gemini. Ask me about B.Tech CSE coursework, code debugging, system architecture, or campus placement preparation.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(CHAT_ROLES[0].id);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState(null);
  const chatBottomRef = useRef(null);

  // ==========================================
  // FEATURE 2: VEO 3 VIDEO GENERATION STATE
  // ==========================================
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoProgressStatus, setVideoProgressStatus] = useState('');
  const [videoResultUrl, setVideoResultUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);

  // Auto-scroll chat thread
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle Multi-Turn Chat Submit
  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    const cleanText = chatInput.trim();
    if (!cleanText || isChatLoading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setChatInput('');
    setIsChatLoading(true);

    const activeRoleConfig = CHAT_ROLES.find((r) => r.id === selectedRole) || CHAT_ROLES[0];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: activeRoleConfig.instruction,
          model: selectedModel
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer from Gemini.');
      }

      if (data.fallbackNotice && notify) {
        notify(data.fallbackNotice, 'info');
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ Error: ${err.message || 'Could not communicate with Gemini API.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errMsg]);
      if (notify) notify(err.message, 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: 'Conversation history cleared. Ready for your next academic question!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Veo 3 Video Generation with Polling
  const handleGenerateVideo = async (e) => {
    if (e) e.preventDefault();
    const cleanPrompt = videoPrompt.trim();
    if (!cleanPrompt || isVideoGenerating) return;

    setIsVideoGenerating(true);
    setVideoError(null);
    setVideoResultUrl(null);
    setVideoProgressStatus('Submitting prompt to Veo 3 (veo-3.1-fast-generate-preview)...');

    try {
      // Step 1: Start video generation
      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          aspectRatio
        })
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to start Veo 3 video generation.');
      }

      const operationName = startData.operationName;
      setVideoProgressStatus('Rendering video frames with Veo 3 neural diffusion model...');

      // Step 2: Poll operation status
      let isDone = false;
      let attempts = 0;
      const maxAttempts = 40; // up to ~3.5 minutes

      while (!isDone && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 6000));
        attempts++;

        if (attempts === 3) {
          setVideoProgressStatus('Simulating camera motion and physical dynamics...');
        } else if (attempts === 6) {
          setVideoProgressStatus('Enhancing lighting, texture detail, and temporal consistency...');
        } else if (attempts > 10) {
          setVideoProgressStatus('Encoding high-definition MP4 output stream...');
        }

        const pollRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        });

        const pollData = await pollRes.json();
        if (pollData.error) {
          throw new Error(pollData.error.message || 'Video generation failed during rendering.');
        }

        if (pollData.done) {
          isDone = true;
          break;
        }
      }

      if (!isDone) {
        throw new Error('Video generation is taking longer than expected. Please try again shortly.');
      }

      // Step 3: Download video
      setVideoProgressStatus('Downloading completed MP4 video...');
      const downloadRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName })
      });

      if (!downloadRes.ok) {
        const errData = await downloadRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to download generated video.');
      }

      const videoBlob = await downloadRes.blob();
      const objectUrl = URL.createObjectURL(videoBlob);
      setVideoResultUrl(objectUrl);
      if (notify) notify('Veo 3 video generated successfully!', 'success');
    } catch (err) {
      console.error('Video generation error:', err);
      setVideoError(err.message || 'Video generation error.');
      if (notify) notify(err.message, 'error');
    } finally {
      setIsVideoGenerating(false);
      setVideoProgressStatus('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
              FileNest AI Studio
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Academic AI Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Multi-turn Gemini engineering tutor with role switching &amp; Veo 3 text-to-video conceptual generator.
          </p>
        </div>

        {/* Combined One-Part Feature Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Gemini Chatbot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Veo 3 Video Generator</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: GEMINI MULTI-TURN ACADEMIC CHATBOT               */}
      {/* ======================================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Roles & Model Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Chatbot Persona</span>
                </h3>
                <div className="space-y-1.5">
                  {CHAT_ROLES.map((role) => {
                    const RoleIcon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#2563EB] text-[#1E3A8A] dark:text-blue-300 font-semibold shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <RoleIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <div className="truncate">{role.title}</div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                            {role.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gemini Model Selector */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Gemini Model
                </h3>
                <div className="space-y-1.5">
                  {MODEL_OPTIONS.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#2563EB] text-[#1E3A8A] dark:text-blue-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{m.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-normal line-clamp-1">
                          {m.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Conversation Action */}
              <button
                type="button"
                onClick={handleClearChat}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors border border-dashed border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Chat Thread</span>
              </button>
            </div>
          </div>

          {/* Right Column: Chat Thread & Input */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {/* Chat Thread Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {CHAT_ROLES.find((r) => r.id === selectedRole)?.title}
                </span>
                <span className="text-[11px] font-mono text-slate-400">({selectedModel})</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {messages.length} {messages.length === 1 ? 'turn' : 'turns'}
              </span>
            </div>

            {/* Scrollable Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                      }`}
                    >
                      {isUser ? 'You' : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className="space-y-1">
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#2563EB] text-white rounded-tr-none shadow-xs'
                            : msg.isError
                            ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-tl-none'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                      </div>

                      {/* Meta actions */}
                      <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{msg.timestamp}</span>
                        {msg.modelUsed && !isUser && (
                          <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[9px]">
                            {msg.modelUsed}
                          </span>
                        )}
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Gemini is synthesizing academic response...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Starter Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900 flex gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-semibold whitespace-nowrap self-center">Try:</span>
                {[
                  'Explain Virtual Memory & Paging',
                  'Write QuickSort in C++ with Big-O',
                  'What are ACID properties in DBMS?'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setChatInput(prompt);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] rounded-lg text-slate-700 dark:text-slate-300 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask ${CHAT_ROLES.find((r) => r.id === selectedRole)?.title}...`}
                disabled={isChatLoading}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="inline-flex items-center justify-center p-3 sm:px-5 sm:py-3 rounded-xl bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: VEO 3 VIDEO GENERATION (veo-3.1-fast-generate-preview) */}
      {/* ======================================================== */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Generation Controls Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-[#2563EB]" />
                    <span>Veo 3 Video Generator</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    veo-3.1-fast-generate-preview
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Generate engineering animations and academic concept videos directly from natural language prompts using Google Veo 3.
                </p>
                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tier Note:</strong> Veo 3 video generation requires a billing-enabled Gemini API key. If using a free key, you can freely use the <strong>Gemini Chatbot</strong> tab with Gemini 3.8 Flash &amp; Flash Lite!
                  </span>
                </div>
              </div>

              {/* Prompt Input Form */}
              <form onSubmit={handleGenerateVideo} className="space-y-5">
                <div>
                  <label htmlFor="video-prompt-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Describe Your Video Prompt *
                  </label>
                  <textarea
                    id="video-prompt-input"
                    rows={4}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g. A 3D animation showing data packets traveling through network cables into server racks with glowing cyan pulses..."
                    disabled={isVideoGenerating}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] leading-relaxed resize-none"
                  />
                </div>

                {/* Aspect Ratio Selector (Mandatory 16:9 or 9:16) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Aspect Ratio *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAspectRatio('16:9')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        aspectRatio === '16:9'
                          ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/50 text-[#1E3A8A] dark:text-blue-300 font-semibold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">16:9 Landscape</span>
                        <div className="w-5 h-3 border-2 border-current rounded-xs" />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Optimal for YouTube, desktop lectures &amp; slides
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAspectRatio('9:16')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        aspectRatio === '9:16'
                          ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/50 text-[#1E3A8A] dark:text-blue-300 font-semibold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">9:16 Portrait</span>
                        <div className="w-3 h-5 border-2 border-current rounded-xs" />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Optimal for smartphones, reels &amp; quick shorts
                      </p>
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={isVideoGenerating || !videoPrompt.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1E3A8A] transition-all disabled:opacity-40 shadow-xs cursor-pointer active:scale-98"
                >
                  {isVideoGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating with Veo 3...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Veo 3 Video</span>
                    </>
                  )}
                </button>
              </form>

              {/* Starter Ideas */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Sample Engineering Prompts
                </p>
                <div className="space-y-1.5">
                  {VIDEO_STARTER_PROMPTS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => setVideoPrompt(starter)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] text-slate-700 dark:text-slate-300 hover:text-[#2563EB] transition-colors line-clamp-1 cursor-pointer"
                    >
                      &rarr; {starter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Preview & Output Player Panel */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#2563EB]" />
                    <span>Video Output Player</span>
                  </h3>
                  {videoResultUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Ready • MP4
                    </span>
                  )}
                </div>

                {/* Player Container */}
                <div className="mt-5 flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[300px] relative">
                  {isVideoGenerating ? (
                    <div className="p-8 text-center space-y-4 max-w-sm">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                        <Film className="w-6 h-6 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Generating Video</h4>
                        <p className="mt-1 text-xs text-blue-200 leading-relaxed font-mono">
                          {videoProgressStatus || 'Veo 3 neural video pipeline active...'}
                        </p>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#2563EB] h-1.5 rounded-full animate-pulse w-3/4" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Veo 3 synthesizes high-definition frames and coherent physical motion. This typically takes 1 to 2 minutes.
                      </p>
                    </div>
                  ) : videoResultUrl ? (
                    <video
                      src={videoResultUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className={`max-h-[420px] w-auto mx-auto object-contain ${
                        aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                      }`}
                    />
                  ) : videoError ? (
                    <div className="p-6 text-center space-y-2 max-w-sm">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Generation Notice</h4>
                      <p className="text-xs text-red-200 leading-relaxed">
                        {videoError}
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <Film className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">
                        No video generated yet. Enter a prompt on the left and click Generate!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Finished Video */}
              {videoResultUrl && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <a
                    href={videoResultUrl}
                    download="veo3_academic_video.mp4"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(videoPrompt);
                      if (notify) notify('Video prompt copied to clipboard!', 'success');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
