import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

/**
 * Multi-Turn Gemini Chatbot Endpoint
 * Supports models:
 * - gemini-4-argon (Complex STEM & Advanced Reasoning)
 * - gemini-3.8-flash (General Tasks & Study Help)
 * - gemini-3.1-flash-lite (Fast Tasks & Quick Q&A)
 */
app.post('/api/chat', async (req, res) => {
  const { messages, systemInstruction, model } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Allowed models
  const validModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  const requestedModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

  const contents = messages.map((m: any) => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || m.text || '') }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: requestedModel,
      contents,
      config: {
        systemInstruction:
          systemInstruction ||
          'You are an expert Academic Tutor and Computer Science mentor for college engineering students. Provide clear, well-structured, supportive, and precise explanations.'
      }
    });

    return res.json({
      text: response.text || '',
      model: requestedModel
    });
  } catch (err: any) {
    console.error(`Gemini chat error with model ${requestedModel}:`, err?.message);

    // If requestedModel was argon or flash and failed due to quota/high-demand, attempt fallback to flash-lite
    if (requestedModel !== 'gemini-3.1-flash-lite') {
      try {
        console.log('Attempting automatic fast fallback to gemini-3.1-flash-lite...');
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction:
              systemInstruction ||
              'You are an expert Academic Tutor and Computer Science mentor for college engineering students.'
          }
        });

        return res.json({
          text: fallbackRes.text || '',
          model: 'gemini-3.1-flash-lite',
          fallbackNotice: `Notice: Switched to gemini-3.1-flash-lite due to high demand on ${requestedModel}.`
        });
      } catch (fallbackErr: any) {
        console.error('Fallback also failed:', fallbackErr?.message);
      }
    }

    return res.status(err?.status || 500).json({
      error:
        err?.message ||
        'Failed to generate response from Gemini. Please check your API key in Settings > Secrets.'
    });
  }
});

/**
 * 1. Start Veo 3 Video Generation
 * Uses model: veo-3.1-fast-generate-preview
 * Supports aspect ratio: 16:9 or 9:16
 */
app.post('/api/generate-video', async (req, res) => {
  const { prompt, aspectRatio } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A descriptive video prompt is required.' });
  }

  const validRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt.trim(),
      config: {
        numberOfVideos: 1,
        aspectRatio: validRatio
      }
    });

    return res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error('Veo video generation error:', err?.message);
    const isQuota = err?.status === 429 || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(err?.status || 500).json({
      error: isQuota
        ? 'Veo 3 video generation requires a billing-enabled Gemini API key. Please check your project billing or select a paid key in Settings > Secrets.'
        : err?.message || 'Failed to start video generation.'
    });
  }
});

/**
 * 2. Poll Veo 3 Video Status
 */
app.post('/api/video-status', async (req, res) => {
  const { operationName } = req.body;

  if (!operationName) {
    return res.status(400).json({ error: 'operationName is required' });
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    return res.json({
      done: Boolean(updated.done),
      error: updated.error || null
    });
  } catch (err: any) {
    console.error('Veo status check error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Failed to query video operation status.' });
  }
});

/**
 * 3. Download Generated Veo 3 Video
 */
app.post('/api/video-download', async (req, res) => {
  const { operationName } = req.body;

  if (!operationName) {
    return res.status(400).json({ error: 'operationName is required' });
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'Video URI not found or video is still rendering.' });
    }

    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey
      }
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to retrieve video stream from Google.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="veo3_generated_video.mp4"');

    const arrayBuffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Veo download error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Failed to download generated video.' });
  }
});

// ============================================================================
// SHARED PERSISTENT CURRICULUM SUBJECTS STORAGE (ALL USERS & DEVICES)
// ============================================================================
const SUBJECTS_DATA_FILE = path.resolve(__dirname, 'data', 'curriculum_subjects.json');

// Ensure data folder exists
if (!fs.existsSync(path.dirname(SUBJECTS_DATA_FILE))) {
  fs.mkdirSync(path.dirname(SUBJECTS_DATA_FILE), { recursive: true });
}

const DEFAULT_BASELINE_SUBJECTS: { [sem: number]: string[] } = {
  1: ["Engineering Mathematics-I", "pps", "Programming in C"],
  2: [],
  3: ["Data Structures & Algorithms"],
  4: [],
  5: [],
  6: [],
  7: [],
  8: []
};

function readServerSubjects(): { [sem: number]: string[] } {
  try {
    if (fs.existsSync(SUBJECTS_DATA_FILE)) {
      const raw = fs.readFileSync(SUBJECTS_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const result: { [sem: number]: string[] } = {};
        for (let s = 1; s <= 8; s++) {
          result[s] = Array.isArray(parsed[s])
            ? Array.from(new Set(parsed[s].map((x: any) => String(x).trim()).filter(Boolean)))
            : [];
        }
        return result;
      }
    }
  } catch (err) {
    console.warn('Error reading server subjects file:', err);
  }
  return { ...DEFAULT_BASELINE_SUBJECTS };
}

function writeServerSubjects(subjectsMap: { [sem: number]: string[] }) {
  const clean: { [sem: number]: string[] } = {};
  for (let s = 1; s <= 8; s++) {
    clean[s] = Array.isArray(subjectsMap[s])
      ? Array.from(new Set(subjectsMap[s].map((x: any) => String(x).trim()).filter(Boolean)))
      : [];
  }
  fs.writeFileSync(SUBJECTS_DATA_FILE, JSON.stringify(clean, null, 2), 'utf-8');
  return clean;
}

/**
 * GET /api/curriculum-subjects
 * Returns the current shared subjects map for all 8 semesters.
 * Visible to all students, friends, and devices.
 */
app.get('/api/curriculum-subjects', (_req, res) => {
  const subjects = readServerSubjects();
  return res.json({ subjects });
});

/**
 * POST /api/curriculum-subjects
 * Saves updated subjects map directly to shared server storage.
 * Ensures any change made by Admin is immediately visible to all visitors.
 */
app.post('/api/curriculum-subjects', (req, res) => {
  const { subjects } = req.body;
  if (!subjects || typeof subjects !== 'object') {
    return res.status(400).json({ error: 'Valid subjects map is required.' });
  }

  try {
    const updated = writeServerSubjects(subjects);
    return res.json({ success: true, subjects: updated });
  } catch (err: any) {
    console.error('Error updating subjects on server:', err);
    return res.status(500).json({ error: err?.message || 'Failed to persist subjects.' });
  }
});

// ============================================================================
// SINGLE PRIMARY ADMIN REGISTRY & RESTRICTED ACCESS
// ============================================================================
const ADMIN_ACCOUNTS_FILE = path.resolve(__dirname, 'data', 'admin_accounts.json');
const PRIMARY_ADMIN_FILE = path.resolve(__dirname, 'data', 'primary_admin.json');

// Fixed Single Master Administrator (krish kumar jaiswal)
const FIXED_PRIMARY_ADMIN = {
  username: 'krish',
  email: 'krishkumarjaiswal2081@gmail.com',
  fullName: 'krish kumar jaiswal',
  saltHex: '9e6b2afef5112d459005cc629cf4bff8',
  hashHex: '69f5cf56c453bd044ec30dc42cbd72f058f83296fb7f26a57b3570df52c3bd5d',
  createdAt: '2026-10-17T19:08:42.147Z',
  lastLoginAt: '2026-10-17T19:08:42.148Z'
};

function readServerPrimaryAdmin(): any {
  try {
    if (fs.existsSync(PRIMARY_ADMIN_FILE)) {
      const raw = fs.readFileSync(PRIMARY_ADMIN_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.hashHex && parsed.username === 'krish') return parsed;
    }
  } catch (err) {
    console.warn('Error reading primary admin file:', err);
  }
  // Initialize and write the fixed single administrator
  writeServerPrimaryAdmin(FIXED_PRIMARY_ADMIN);
  return FIXED_PRIMARY_ADMIN;
}

function writeServerPrimaryAdmin(admin: any | null) {
  try {
    const toSave = admin || FIXED_PRIMARY_ADMIN;
    fs.writeFileSync(PRIMARY_ADMIN_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    fs.writeFileSync(ADMIN_ACCOUNTS_FILE, JSON.stringify([toSave], null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing primary admin:', err);
  }
}

/**
 * GET /api/admin/status
 * Returns single admin registration status (does NOT leak credentials or emails)
 */
app.get('/api/admin/status', (_req, res) => {
  const admin = readServerPrimaryAdmin();
  const isRegistered = Boolean(admin && admin.hashHex);
  return res.json({
    isRegistered,
    adminUsername: isRegistered ? admin.username : undefined
  });
});

/**
 * GET /api/admin/accounts
 * Returns metadata for the single admin account
 */
app.get('/api/admin/accounts', (_req, res) => {
  const admin = readServerPrimaryAdmin();
  if (!admin || !admin.hashHex) {
    return res.json({ accounts: [], total: 0, isRegistered: false });
  }
  return res.json({
    accounts: [
      {
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt
      }
    ],
    total: 1,
    isRegistered: true
  });
});

/**
 * POST /api/admin/login
 * Validates credentials strictly against the single administrator account
 */
app.post('/api/admin/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Admin email/username and password are required.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const admin = readServerPrimaryAdmin();

  if (!admin || !admin.hashHex) {
    return res.status(400).json({
      error: 'No administrator account configured yet. Please complete initial setup.'
    });
  }

  const matchesIdentifier =
    admin.username?.toLowerCase() === cleanId || admin.email?.toLowerCase() === cleanId;

  if (!matchesIdentifier) {
    return res.status(401).json({
      error: 'Invalid administrator credentials. Access is restricted exclusively to the single authorized admin.'
    });
  }

  try {
    const computedHash = crypto
      .pbkdf2Sync(String(password), Buffer.from(admin.saltHex, 'hex'), 100000, 32, 'sha256')
      .toString('hex');

    if (computedHash !== admin.hashHex) {
      return res.status(401).json({ error: 'Incorrect password. Access denied.' });
    }

    admin.lastLoginAt = new Date().toISOString();
    writeServerPrimaryAdmin(admin);

    const session = {
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      loginTime: new Date().toISOString(),
      token: `fn_adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    };

    return res.json({ success: true, session, account: admin });
  } catch (err: any) {
    console.error('Login hash verification error:', err);
    return res.status(500).json({ error: 'Internal error verifying credentials.' });
  }
});

/**
 * POST /api/admin/register
 * Only allows initial registration if NO admin exists yet.
 * If an admin is already registered, STRICTLY LOCKS & REJECTS any further registration!
 */
app.post('/api/admin/register', (req, res) => {
  const existing = readServerPrimaryAdmin();
  if (existing && existing.hashHex) {
    return res.status(403).json({
      error: 'Registration is locked. Only one person can be administrator, and the master admin account is already active. No additional admin accounts are permitted.'
    });
  }

  const { account } = req.body;
  if (!account || !account.username || !account.email || !account.hashHex || !account.saltHex) {
    return res.status(400).json({ error: 'Valid admin account credentials are required.' });
  }

  try {
    writeServerPrimaryAdmin(account);
    return res.json({ success: true, isRegistered: true });
  } catch (err: any) {
    console.error('Error saving admin account on server:', err);
    return res.status(500).json({ error: err?.message || 'Failed to save admin account.' });
  }
});

/**
 * POST /api/admin/update-credentials
 * Allows the authenticated single admin to update their email, username, or password
 */
app.post('/api/admin/update-credentials', (req, res) => {
  const { currentPassword, newUsername, newEmail, newFullName, newPassword } = req.body;
  const admin = readServerPrimaryAdmin();

  if (!admin || !admin.hashHex) {
    return res.status(400).json({ error: 'No administrator account configured.' });
  }

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current administrator password is required.' });
  }

  try {
    const computedHash = crypto
      .pbkdf2Sync(String(currentPassword), Buffer.from(admin.saltHex, 'hex'), 100000, 32, 'sha256')
      .toString('hex');

    if (computedHash !== admin.hashHex) {
      return res.status(401).json({ error: 'Incorrect current password. Credential update aborted.' });
    }

    if (newUsername && String(newUsername).trim().length >= 3) {
      admin.username = String(newUsername).trim().toLowerCase();
    }
    if (newEmail && String(newEmail).trim().includes('@')) {
      admin.email = String(newEmail).trim().toLowerCase();
    }
    if (newFullName && String(newFullName).trim().length > 0) {
      admin.fullName = String(newFullName).trim();
    }
    if (newPassword && String(newPassword).length >= 6) {
      const newSalt = crypto.randomBytes(16);
      admin.saltHex = newSalt.toString('hex');
      admin.hashHex = crypto
        .pbkdf2Sync(String(newPassword), newSalt, 100000, 32, 'sha256')
        .toString('hex');
    }

    writeServerPrimaryAdmin(admin);

    const session = {
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      loginTime: new Date().toISOString(),
      token: `fn_adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    };

    return res.json({ success: true, session, message: 'Admin credentials updated successfully.' });
  } catch (err: any) {
    console.error('Error updating credentials:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update credentials.' });
  }
});

/**
 * POST /api/admin/reset
 * Secure reset: only allowed if current admin password is provided
 */
app.post('/api/admin/reset', (req, res) => {
  const { currentPassword } = req.body;
  const admin = readServerPrimaryAdmin();
  if (!admin || !admin.hashHex) {
    writeServerPrimaryAdmin(null);
    return res.json({ success: true, message: 'Admin account cleared.' });
  }

  if (!currentPassword) {
    return res.status(401).json({ error: 'Current password is required to reset administrator account.' });
  }

  try {
    const computedHash = crypto
      .pbkdf2Sync(String(currentPassword), Buffer.from(admin.saltHex, 'hex'), 100000, 32, 'sha256')
      .toString('hex');

    if (computedHash !== admin.hashHex) {
      return res.status(401).json({ error: 'Incorrect administrator password.' });
    }

    writeServerPrimaryAdmin(null);
    return res.json({ success: true, message: 'Administrator credentials have been reset.' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to reset admin account.' });
  }
});

/**
 * Mount Vite Middleware in Development or Serve Static in Production
 */
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
  process.exit(1);
});
