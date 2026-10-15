import express from 'express';
import path from 'path';
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
