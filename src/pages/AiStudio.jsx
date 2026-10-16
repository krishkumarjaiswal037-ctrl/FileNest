import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  HelpCircle,
  Code,
  GraduationCap,
  Briefcase,
  Zap,
  Sliders,
  Play,
  Share2,
  Image as ImageIcon,
  Wand2,
  RotateCw,
  FlipHorizontal,
  Layers,
  Type,
  SlidersHorizontal,
  UploadCloud,
  Eye,
  Crop,
  Sun,
  Palette
} from 'lucide-react';
import {
  generateImageFromPrompt,
  editImage,
  IMAGE_STYLES,
  SAMPLE_IMAGE_PROMPTS
} from '../tools/imageGenerator';
import { synthesizeVideoFromPrompt } from '../tools/videoSynthesizer';
import { generateOfflineAcademicResponse } from '../tools/offlineAcademicEngine';

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

export default function AiStudio({ notify }) {
  // Navigation between the two features: 'chat' (Gemini Chatbot) and 'image' (Create & Edit Images)
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
  // FEATURE 2: CREATE & EDIT IMAGES STATE (100% FREE • ZERO API KEY)
  // ==========================================
  const [imageStudioTab, setImageStudioTab] = useState('create'); // 'create' | 'edit'

  // Image Creation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [imageResolution, setImageResolution] = useState('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageProgressStatus, setImageProgressStatus] = useState('');
  const [imageProgressPct, setImageProgressPct] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageError, setImageError] = useState(null);

  // Image Editor State
  const [editorImageSrc, setEditorImageSrc] = useState(null);
  const [editorFilter, setEditorFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [blur, setBlur] = useState(0);
  const [vignette, setVignette] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(32);
  const [textPosition, setTextPosition] = useState('bottom');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedResultUrl, setEditedResultUrl] = useState(null);
  const [editorError, setEditorError] = useState(null);
  const fileInputRef = useRef(null);

  // Procedural Video Generator State (Zero API Key)
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoProgressPct, setVideoProgressPct] = useState(0);
  const [videoProgressStatus, setVideoProgressStatus] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const liveVideoCanvasRef = useRef(null);

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
      console.warn('Live Gemini API unavailable, generating answer via Offline Academic AI Engine:', err?.message);
      // Seamless Zero-API Fallback Engine for students without an API key
      const offlineAnswer = generateOfflineAcademicResponse({
        prompt: cleanText,
        role: selectedRole
      });

      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: offlineAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Academic AI Engine (Zero-API)',
        isOfflineFallback: true
      };

      setMessages((prev) => [...prev, botMsg]);
      if (notify) {
        notify('Answered via Academic AI Engine (No API key needed)', 'info');
      }
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

  // Handle Text-to-Image Generation (Free, Zero API Key)
  const handleGenerateImage = async (e) => {
    if (e) e.preventDefault();
    const cleanPrompt = imagePrompt.trim();
    if (!cleanPrompt || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setImageError(null);
    setImageProgressPct(10);
    setImageProgressStatus('Analyzing prompt aesthetics and composition...');

    try {
      const res = await generateImageFromPrompt({
        prompt: cleanPrompt,
        style: selectedStyle,
        aspectRatio: imageAspectRatio,
        resolution: imageResolution,
        onProgress: (pct, status) => {
          setImageProgressPct(pct);
          setImageProgressStatus(status);
        }
      });

      setGeneratedImage(res);
      if (notify) notify('Image generated successfully! No API key needed.', 'success');
    } catch (err) {
      console.error('Image generation error:', err);
      setImageError(err.message || 'Could not generate image.');
      if (notify) notify(err.message, 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle Client-Side Procedural Video Synthesis (100% Free • Zero API Key)
  const handleGenerateVideo = async (e) => {
    if (e) e.preventDefault();
    const cleanPrompt = videoPrompt.trim();
    if (!cleanPrompt || isVideoGenerating) return;

    setIsVideoGenerating(true);
    setVideoError(null);
    setVideoProgressPct(5);
    setVideoProgressStatus('Analyzing prompt concepts and initializing storyboard...');
    setGeneratedVideo(null);

    try {
      const res = await synthesizeVideoFromPrompt({
        prompt: cleanPrompt,
        aspectRatio: videoAspectRatio,
        previewCanvas: liveVideoCanvasRef.current,
        onProgress: (pct, status) => {
          setVideoProgressPct(pct);
          setVideoProgressStatus(status);
        }
      });

      setGeneratedVideo(res);
      if (notify) notify('Conceptual Video generated successfully! (Zero API key needed)', 'success');
    } catch (err) {
      console.error('Video generation error:', err);
      setVideoError(err.message || 'Could not generate video.');
      if (notify) notify(err.message || 'Could not generate video.', 'error');
    } finally {
      setIsVideoGenerating(false);
    }
  };

  // Open generated image directly in Editor
  const handleSendToEditor = (imgSrc) => {
    setEditorImageSrc(imgSrc);
    setImageStudioTab('edit');
    setEditedResultUrl(null);
    if (notify) notify('Loaded into Image Editor! Tweak filters, lighting & captions below.', 'info');
  };

  // File upload for editing
  const handleEditorFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditorImageSrc(event.target?.result);
      setEditedResultUrl(null);
      if (notify) notify('Image loaded for editing!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Run edit filter pipeline
  const applyImageEdits = useCallback(async () => {
    if (!editorImageSrc) return;
    setIsEditingImage(true);
    setEditorError(null);
    try {
      const res = await editImage({
        imageSrc: editorImageSrc,
        filterName: editorFilter,
        brightness,
        contrast,
        saturation,
        warmth,
        blur,
        vignette,
        textOverlay,
        textColor,
        textSize,
        textPosition,
        rotation,
        flipH
      });
      setEditedResultUrl(res.dataUrl);
    } catch (err) {
      console.error('Edit error:', err);
      setEditorError(err.message || 'Could not apply edits.');
    } finally {
      setIsEditingImage(false);
    }
  }, [
    editorImageSrc,
    editorFilter,
    brightness,
    contrast,
    saturation,
    warmth,
    blur,
    vignette,
    textOverlay,
    textColor,
    textSize,
    textPosition,
    rotation,
    flipH
  ]);

  // Real-time auto update editor preview on slider/filter change
  useEffect(() => {
    if (editorImageSrc && activeTab === 'image' && imageStudioTab === 'edit') {
      const timer = setTimeout(() => {
        applyImageEdits();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [editorImageSrc, activeTab, imageStudioTab, applyImageEdits]);

  // Reset editor settings
  const handleResetEditor = () => {
    setEditorFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setBlur(0);
    setVignette(false);
    setRotation(0);
    setFlipH(false);
    setTextOverlay('');
    setTextColor('#FFFFFF');
    setTextSize(32);
    setTextPosition('bottom');
    setEditedResultUrl(null);
    if (notify) notify('Editor adjustments reset to default.', 'info');
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
            Multi-turn Gemini engineering tutor with role switching, DSA problem solver &amp; academic explanations.
          </p>
        </div>

        {/* Feature Header Badge */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700">
            <Bot className="w-4 h-4" />
            <span>Gemini Academic Chatbot</span>
          </div>
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
      {/* VIEW 2: CREATE & EDIT IMAGES STUDIO (100% FREE • ZERO API KEY) */}
      {/* ======================================================== */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          {/* Sub-mode Tab Switcher: Create vs Edit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => setImageStudioTab('create')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  imageStudioTab === 'create'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Create with Text Prompt</span>
              </button>
              <button
                type="button"
                onClick={() => setImageStudioTab('edit')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  imageStudioTab === 'edit'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Edit &amp; Enhance Image</span>
              </button>
              <button
                type="button"
                onClick={() => setImageStudioTab('video')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  imageStudioTab === 'video'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Text to Video (No API)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Free • No API Key or Billing Required</span>
            </div>
          </div>

          {/* SUB-VIEW A: CREATE IMAGE WITH TEXT PROMPT */}
          {imageStudioTab === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Controls Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-[#2563EB]" />
                        <span>AI Image Synthesizer</span>
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        Neural Synthesis
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Generate artistic landscapes, technical diagrams, cyberpunk art, or abstract compositions from natural language.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleGenerateImage} className="space-y-5">
                    <div>
                      <label htmlFor="image-prompt-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Enter Image Prompt *
                      </label>
                      <textarea
                        id="image-prompt-input"
                        rows={3}
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="e.g. Cyberpunk neon city skyline with rain reflections and glowing holographic billboards..."
                        disabled={isGeneratingImage}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] leading-relaxed resize-none"
                      />
                    </div>

                    {/* Style Presets */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Artistic Style
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {IMAGE_STYLES.map((st) => {
                          const isSel = selectedStyle === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setSelectedStyle(st.id)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                isSel
                                  ? 'border-[#2563EB] bg-blue-50/80 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-200 font-bold shadow-2xs'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="text-xs font-semibold truncate">{st.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                                {st.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aspect Ratio & Resolution */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Aspect Ratio
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: '1:1', label: '1:1 Square' },
                            { id: '16:9', label: '16:9 Wide' },
                            { id: '9:16', label: '9:16 Story' },
                            { id: '4:3', label: '4:3 Classic' }
                          ].map((ar) => (
                            <button
                              key={ar.id}
                              type="button"
                              onClick={() => setImageAspectRatio(ar.id)}
                              className={`py-2 px-2.5 rounded-lg border text-xs text-center font-medium transition-all cursor-pointer ${
                                imageAspectRatio === ar.id
                                  ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950 text-[#1E3A8A] dark:text-blue-300 font-bold shadow-2xs'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {ar.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Resolution
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: '1K', label: '1K Standard' },
                            { id: '2K', label: '2K Ultra HD' }
                          ].map((res) => (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => setImageResolution(res.id)}
                              className={`py-2 px-2.5 rounded-lg border text-xs text-center font-medium transition-all cursor-pointer ${
                                imageResolution === res.id
                                  ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950 text-[#1E3A8A] dark:text-blue-300 font-bold shadow-2xs'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {res.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="submit"
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1E3A8A] transition-all disabled:opacity-40 shadow-xs cursor-pointer active:scale-98"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Image ({imageProgressPct}%)...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Generate Image (Free)</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Starter Prompts */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Try Sample Prompts
                    </p>
                    <div className="space-y-1.5">
                      {SAMPLE_IMAGE_PROMPTS.map((starter) => (
                        <button
                          key={starter}
                          type="button"
                          onClick={() => setImagePrompt(starter)}
                          className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] text-slate-700 dark:text-slate-300 hover:text-[#2563EB] transition-colors line-clamp-1 cursor-pointer"
                        >
                          &rarr; {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Column */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#2563EB]" />
                        <span>Generated Image Output</span>
                      </h3>
                      {generatedImage ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {generatedImage.width}x{generatedImage.height} • {generatedImage.style.toUpperCase()}
                        </span>
                      ) : isGeneratingImage ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 animate-pulse">
                          Rendering {imageProgressPct}%
                        </span>
                      ) : null}
                    </div>

                    {/* Canvas/Image Box */}
                    <div className="mt-5 flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[340px] relative p-3">
                      {isGeneratingImage ? (
                        <div className="text-center space-y-4 p-8 max-w-sm">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                            <Wand2 className="w-6 h-6 animate-spin" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Synthesizing Image</h4>
                            <p className="mt-1 text-xs text-blue-200 font-mono">
                              {imageProgressStatus || 'Rendering procedural aesthetics...'}
                            </p>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-150"
                              style={{ width: `${Math.max(10, imageProgressPct)}%` }}
                            />
                          </div>
                        </div>
                      ) : generatedImage ? (
                        <div className="relative group max-w-full">
                          <img
                            src={generatedImage.dataUrl}
                            alt={generatedImage.prompt}
                            className="max-h-[400px] w-auto mx-auto object-contain rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                        </div>
                      ) : imageError ? (
                        <div className="p-6 text-center space-y-2 max-w-sm">
                          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                          <h4 className="text-sm font-bold text-white">Generation Error</h4>
                          <p className="text-xs text-red-200 leading-relaxed">{imageError}</p>
                          <button
                            type="button"
                            onClick={handleGenerateImage}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-400 max-w-xs">
                            No image generated yet. Choose a style, enter your prompt, and click Generate!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {generatedImage && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={generatedImage.dataUrl}
                          download="filenest_ai_image.png"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PNG</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleSendToEditor(generatedImage.dataUrl)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Edit in Studio</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(imagePrompt);
                            if (notify) notify('Prompt copied to clipboard!', 'success');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateImage}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-Generate</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW B: EDIT & ENHANCE IMAGE */}
          {imageStudioTab === 'edit' && (
            <div className="space-y-6">
              {!editorImageSrc ? (
                /* Upload Dropzone when no image loaded */
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950 text-[#2563EB] flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Upload an Image to Edit &amp; Enhance
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Apply artistic preset filters, adjust lighting and contrast, rotate, flip, and add custom text overlays.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleEditorFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#2563EB] hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Select Image File</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const starter = await generateImageFromPrompt({
                          prompt: 'Cyberpunk neon algorithm visualizer',
                          style: 'technical'
                        });
                        setEditorImageSrc(starter.dataUrl);
                        if (notify) notify('Loaded sample technical diagram for editing!', 'info');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>Load Sample Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Image Editor Studio when image is loaded */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Editor Controls Column */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                          <span>Image Adjustments &amp; Filters</span>
                        </h3>
                        <button
                          type="button"
                          onClick={handleResetEditor}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          Reset All
                        </button>
                      </div>

                      {/* Preset Filters */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Preset Color Filter
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'none', label: 'Original', dot: '#94a3b8' },
                            { id: 'emerald', label: 'Emerald Mint', dot: '#059669' },
                            { id: 'purple', label: 'Royal Purple', dot: '#7c3aed' },
                            { id: 'cyberpunk', label: 'Cyberpunk', dot: '#ec4899' },
                            { id: 'noir', label: 'Noir B&W', dot: '#1e293b' },
                            { id: 'vintage', label: 'Vintage Sepia', dot: '#d97706' },
                            { id: 'golden', label: 'Golden Hour', dot: '#f59e0b' },
                            { id: 'cool', label: 'Cool Cyan', dot: '#06b6d4' }
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setEditorFilter(f.id)}
                              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                editorFilter === f.id
                                  ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-300 font-bold shadow-2xs'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full mx-auto block mb-1 border shadow-xs"
                                style={{ backgroundColor: f.dot }}
                              />
                              <span className="text-[10px] leading-tight block truncate">{f.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sliders */}
                      <div className="space-y-3 pt-2">
                        {/* Brightness */}
                        <div>
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <span>Brightness</span>
                            <span className="font-mono text-slate-400">{brightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="160"
                            value={brightness}
                            onChange={(e) => setBrightness(Number(e.target.value))}
                            className="w-full accent-[#2563EB]"
                          />
                        </div>

                        {/* Contrast */}
                        <div>
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <span>Contrast</span>
                            <span className="font-mono text-slate-400">{contrast}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="180"
                            value={contrast}
                            onChange={(e) => setContrast(Number(e.target.value))}
                            className="w-full accent-[#2563EB]"
                          />
                        </div>

                        {/* Saturation */}
                        <div>
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <span>Saturation</span>
                            <span className="font-mono text-slate-400">{saturation}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={saturation}
                            onChange={(e) => setSaturation(Number(e.target.value))}
                            className="w-full accent-[#2563EB]"
                          />
                        </div>

                        {/* Warmth */}
                        <div>
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <span>Color Warmth</span>
                            <span className="font-mono text-slate-400">{warmth > 0 ? `+${warmth}` : warmth}</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            value={warmth}
                            onChange={(e) => setWarmth(Number(e.target.value))}
                            className="w-full accent-[#2563EB]"
                          />
                        </div>

                        {/* Blur */}
                        <div>
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <span>Soft Blur</span>
                            <span className="font-mono text-slate-400">{blur}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={blur}
                            onChange={(e) => setBlur(Number(e.target.value))}
                            className="w-full accent-[#2563EB]"
                          />
                        </div>
                      </div>

                      {/* Transform Controls */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Transform &amp; Effects
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setRotation((prev) => (prev + 90) % 360)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Rotate 90°</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFlipH((prev) => !prev)}
                            className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                              flipH
                                ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950 text-[#2563EB]'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <FlipHorizontal className="w-3.5 h-3.5" />
                            <span>Flip H</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVignette((prev) => !prev)}
                            className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                              vignette
                                ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950 text-[#2563EB]'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            <span>Vignette</span>
                          </button>
                        </div>
                      </div>

                      {/* Text Overlay */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Text Caption &amp; Title Overlay
                        </label>
                        <input
                          type="text"
                          value={textOverlay}
                          onChange={(e) => setTextOverlay(e.target.value)}
                          placeholder="e.g. FILENEST STUDY NOTES • 2026"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                        {textOverlay && (
                          <div className="grid grid-cols-3 gap-2">
                            {['top', 'center', 'bottom'].map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => setTextPosition(pos)}
                                className={`py-1 rounded-lg border text-[11px] font-semibold capitalize ${
                                  textPosition === pos
                                    ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950 text-[#2563EB]'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editor Live Preview Column */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[500px]">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Eye className="w-4 h-4 text-[#2563EB]" />
                            <span>Live Edited Image Canvas</span>
                          </h3>
                          <div className="flex items-center gap-2">
                            {isEditingImage && (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Updating...</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-semibold text-[#2563EB] hover:underline"
                            >
                              Replace Image
                            </button>
                          </div>
                        </div>

                        {/* Image Canvas Container */}
                        <div className="mt-5 flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[380px] p-3">
                          <img
                            src={editedResultUrl || editorImageSrc}
                            alt="Edited preview"
                            className="max-h-[440px] w-auto mx-auto object-contain rounded-xl shadow-2xl"
                          />
                        </div>
                      </div>

                      {/* Export & Actions */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <a
                          href={editedResultUrl || editorImageSrc}
                          download="filenest_edited_image.png"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Edited Image</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setEditorImageSrc(null);
                            setEditedResultUrl(null);
                            handleResetEditor();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW C: PROCEDURAL NEURAL VIDEO GENERATOR (100% FREE • ZERO API KEY) */}
          {imageStudioTab === 'video' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Controls Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Play className="w-5 h-5 text-[#2563EB]" />
                        <span>Procedural Video Generator</span>
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Zero API Key
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Convert any academic concept or technical topic into a 30 FPS animated conceptual video with kinetic typography and audio.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleGenerateVideo} className="space-y-5">
                    <div>
                      <label htmlFor="video-prompt-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Enter Video Topic / Concept *
                      </label>
                      <textarea
                        id="video-prompt-input"
                        rows={3}
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder="e.g. Binary Search Tree balanced algorithm visualization..."
                        disabled={isVideoGenerating}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] leading-relaxed resize-none"
                      />
                    </div>

                    {/* Quick Topic Chips */}
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Sample Academic Topics
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Binary Search Tree balanced algorithm visualization',
                          'Computer Networks TCP 3-way handshake data flow',
                          'Operating System process deadlock circular wait',
                          'Microprocessor CPU cache register pipeline'
                        ].map((sample) => (
                          <button
                            key={sample}
                            type="button"
                            onClick={() => setVideoPrompt(sample)}
                            disabled={isVideoGenerating}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors text-left"
                          >
                            {sample.split(' ')[0]} {sample.split(' ')[1]}...
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setVideoAspectRatio('16:9')}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            videoAspectRatio === '16:9'
                              ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="w-6 h-3.5 border-2 border-current rounded-xs" />
                          <span>16:9 Landscape</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoAspectRatio('9:16')}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            videoAspectRatio === '9:16'
                              ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="w-3.5 h-6 border-2 border-current rounded-xs" />
                          <span>9:16 Portrait</span>
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!videoPrompt.trim() || isVideoGenerating}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
                    >
                      {isVideoGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Video...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Synthesize 30 FPS Video</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Engine Notes */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Zero API Key Architecture</span>
                    </div>
                    <p>
                      Runs 100% in your browser using HTML5 Canvas captureStream and MediaRecorder. Generates high-definition video with no server limits or billing keys.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview & Video Output Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[500px]">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#2563EB]" />
                        <span>Real-Time Video Screen</span>
                      </h3>
                      {isVideoGenerating && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                          <span>Rendering Frame by Frame...</span>
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isVideoGenerating && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                          <span className="truncate pr-2">{videoProgressStatus || 'Generating video frames...'}</span>
                          <span>{videoProgressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-blue-200/80 dark:bg-blue-900/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
                            style={{ width: `${videoProgressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Box */}
                    {videoError && (
                      <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Video Generation Notice</p>
                          <p className="mt-0.5">{videoError}</p>
                        </div>
                      </div>
                    )}

                    {/* Video Player or Live Canvas */}
                    <div className="mt-5 flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[380px] p-3 relative">
                      {generatedVideo ? (
                        <video
                          key={generatedVideo.videoUrl}
                          src={generatedVideo.videoUrl}
                          controls
                          autoPlay
                          loop
                          className={`rounded-xl shadow-2xl max-h-[440px] w-auto mx-auto ${
                            videoAspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                          }`}
                        />
                      ) : (
                        <div className="w-full flex flex-col items-center justify-center">
                          <canvas
                            ref={liveVideoCanvasRef}
                            width={videoAspectRatio === '9:16' ? 540 : 960}
                            height={videoAspectRatio === '9:16' ? 960 : 540}
                            className={`max-h-[380px] max-w-full rounded-xl object-contain bg-slate-900 ${
                              isVideoGenerating ? 'block' : 'hidden'
                            }`}
                          />
                          {!isVideoGenerating && (
                            <div className="text-center p-8 text-slate-500 dark:text-slate-400 space-y-3">
                              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                                <Play className="w-8 h-8 opacity-40 ml-1" />
                              </div>
                              <p className="text-sm font-semibold text-slate-400">
                                Ready to generate conceptual video
                              </p>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Enter an academic topic or select a sample topic on the left to synthesize a 30 FPS conceptual video without any API key.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Export & Actions */}
                  {generatedVideo && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <a
                        href={generatedVideo.videoUrl}
                        download={generatedVideo.filename || 'filenest_concept_video.mp4'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Conceptual Video</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedVideo(null);
                          setVideoProgressPct(0);
                          setVideoProgressStatus('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Video</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
