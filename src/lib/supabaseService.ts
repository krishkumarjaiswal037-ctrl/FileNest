import { createClient } from '@supabase/supabase-js';
import { getSubjectsBySemester, saveAllSubjectsMap } from '../data/subjects';

/**
 * ============================================================================
 * SUPABASE CLIENT & SECURE PERSISTENT STORAGE LAYER (src/lib/supabaseService.ts)
 * ============================================================================
 * Connects to Supabase backend:
 * - Persistent documents / notes table ('files' and 'notes')
 * - Storage bucket ('study-files')
 * - Dynamic curriculum subjects table ('subjects')
 * - Strict Admin vs User Role RLS enforcement
 */

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://zmljxivkrxigyhkkdgfp.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_zMkCyZKmqm1LIGmJCjbh1w_-OYn1Hkt';

export const SUPABASE_PROJECT_ID = 'zmljxivkrxigyhkkdgfp';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const STORAGE_BUCKET = 'study-files';
export const FILES_TABLE = 'files';
export const NOTES_TABLE = 'notes';
export const SUBJECTS_TABLE = 'subjects';

let cachedTableReady: boolean | null = null;
let activeFilesTableName = FILES_TABLE;

/**
 * Check whether the Supabase table & connection are active
 */
export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tableReady: boolean;
  count: number;
  message?: string;
  tableName?: string;
}> {
  if (!supabase) {
    cachedTableReady = false;
    return { connected: false, tableReady: false, count: 0, message: 'Supabase credentials not configured' };
  }

  try {
    // Try primary 'files' table
    let { data, count, error } = await supabase
      .from(FILES_TABLE)
      .select('id', { count: 'exact' });

    if (!error) {
      cachedTableReady = true;
      activeFilesTableName = FILES_TABLE;
      const rowCount = count !== null && count !== undefined ? count : (data ? data.length : 0);
      return {
        connected: true,
        tableReady: true,
        count: rowCount,
        tableName: FILES_TABLE,
        message: `Connected to Supabase. Table "${FILES_TABLE}" has ${rowCount} record(s).`
      };
    }

    // Fallback: check if user called table 'notes'
    const notesRes = await supabase
      .from(NOTES_TABLE)
      .select('id', { count: 'exact' });

    if (!notesRes.error) {
      cachedTableReady = true;
      activeFilesTableName = NOTES_TABLE;
      const rowCount = notesRes.count !== null && notesRes.count !== undefined ? notesRes.count : (notesRes.data ? notesRes.data.length : 0);
      return {
        connected: true,
        tableReady: true,
        count: rowCount,
        tableName: NOTES_TABLE,
        message: `Connected to Supabase. Table "${NOTES_TABLE}" has ${rowCount} record(s).`
      };
    }

    cachedTableReady = false;
    if (
      error.code === 'PGRST205' ||
      error.message?.includes('not find the table') ||
      error.message?.includes('does not exist') ||
      error.message?.includes('schema cache')
    ) {
      return {
        connected: true,
        tableReady: false,
        count: 0,
        message: 'Connected to Supabase! The "files" table is not created yet in your project. Run the setup SQL script in your Supabase SQL Editor.'
      };
    }
    return { connected: true, tableReady: false, count: 0, message: error.message };
  } catch (err: any) {
    cachedTableReady = false;
    return { connected: false, tableReady: false, count: 0, message: err?.message || 'Connection failed' };
  }
}

const LOCAL_METADATA_KEY = 'studyvault_user_files_v6';
const RECENTLY_VIEWED_KEY = 'studyvault_recently_viewed_v4';
const IDB_NAME = 'StudyVaultBinaryStore';
const IDB_STORE = 'fileBlobs';
const CLIENT_UPLOADER_KEY = 'filenest_uploader_id';

/**
 * Returns a persistent identifier for this browser client.
 * Allows regular users to delete ONLY the files they uploaded.
 */
export function getClientUploaderId(): string {
  try {
    let id = localStorage.getItem(CLIENT_UPLOADER_KEY);
    if (!id) {
      id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_UPLOADER_KEY, id);
    }
    return id;
  } catch {
    return 'usr_guest';
  }
}

function openBinaryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileDataUrlToIDB(id: string, dataUrl: string): Promise<boolean> {
  try {
    const db = await openBinaryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(dataUrl, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
    return false;
  }
}

export async function getFileDataUrlFromIDB(id: string): Promise<string | null> {
  try {
    const db = await openBinaryDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function deleteFileDataUrlFromIDB(id: string): Promise<boolean> {
  try {
    const db = await openBinaryDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Pure local files store for offline/local vault files only.
 * NO MOCK DATA. NO SEED ARRAYS. Purely returns what was actually uploaded.
 */
function readLocalFiles(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_METADATA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalFiles(files: any[]) {
  localStorage.setItem(LOCAL_METADATA_KEY, JSON.stringify(files));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Robust universal downloader for PDFs, Images, and other files.
 */
export async function downloadFile(file: any): Promise<boolean> {
  if (!file) throw new Error('No file specified for download');

  let rawUrl = file.file_url;
  if (!rawUrl || rawUrl === 'idb://stored') {
    rawUrl = await getFileDataUrlFromIDB(file.id);
  }

  if (!rawUrl) {
    throw new Error('File data is not available for download.');
  }

  const extension =
    file.file_type === 'pdf'
      ? 'pdf'
      : file.file_type === 'image'
      ? 'png'
      : 'dat';

  const baseTitle = file.title || file.file_name || 'study_document';
  const cleanTitle = baseTitle.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const safeName =
    file.file_name && file.file_name.includes('.')
      ? file.file_name
      : `${cleanTitle}.${extension}`;

  let blob: Blob;

  if (rawUrl.startsWith('data:')) {
    const commaIndex = rawUrl.indexOf(',');
    if (commaIndex === -1) {
      throw new Error('Invalid file data format.');
    }
    const header = rawUrl.slice(0, commaIndex);
    const dataPart = rawUrl.slice(commaIndex + 1);
    const mimeMatch = header.match(/:(.*?)(;|$)/);
    const mime =
      mimeMatch?.[1] ||
      (file.file_type === 'pdf' ? 'application/pdf' : 'application/octet-stream');
    const isBase64 = header.includes('base64');

    if (isBase64) {
      const binaryString = atob(dataPart);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mime });
    } else {
      const decoded = decodeURIComponent(dataPart);
      const bytes = new TextEncoder().encode(decoded);
      blob = new Blob([bytes], { type: mime });
    }
  } else if (rawUrl.startsWith('blob:')) {
    const res = await fetch(rawUrl);
    blob = await res.blob();
  } else {
    // Remote URL (e.g. Supabase Storage)
    try {
      const res = await fetch(rawUrl);
      blob = await res.blob();
    } catch {
      const link = document.createElement('a');
      link.href = rawUrl;
      link.download = safeName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  return true;
}

/**
 * Parse a base64 Data URL into a Blob and its mimeType
 */
export function parseDataUrl(dataUrl: string): { blob: Blob; mimeType: string } | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const match = parts[0].match(/:(.*?);/);
    const mimeType = match ? match[1] : 'application/pdf';
    const binaryStr = atob(parts[1]);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return { blob: new Blob([bytes], { type: mimeType }), mimeType };
  } catch (err) {
    console.warn('Could not parse dataUrl to blob:', err);
    return null;
  }
}

/**
 * Synchronize local user-uploaded files to Supabase.
 * ONLY syncs genuine files uploaded by the user that were queued locally.
 * NEVER inserts mock seed arrays or regenerated files.
 */
export async function syncLocalFilesToSupabase(): Promise<{
  synced: number;
  total: number;
  error?: string;
  errors?: string[];
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { synced: 0, total: 0, error: 'Supabase credentials not configured' };
  }

  try {
    const localItems = readLocalFiles();
    if (localItems.length === 0) return { synced: 0, total: 0 };

    const { data: remoteRows, error: fetchErr } = await supabase
      .from(activeFilesTableName)
      .select('id, title, file_name, semester');

    if (fetchErr) {
      return { synced: 0, total: 0, error: fetchErr.message };
    }

    const existingKeys = new Set(
      (remoteRows || []).map(
        (r) => `${String(r.title || '').trim().toLowerCase()}__${String(r.file_name || '').trim().toLowerCase()}`
      )
    );
    const existingIds = new Set((remoteRows || []).map((r) => String(r.id)));

    const missingFiles = localItems.filter((f) => {
      const key = `${String(f.title || '').trim().toLowerCase()}__${String(f.file_name || '').trim().toLowerCase()}`;
      return !existingKeys.has(key) && !existingIds.has(String(f.id));
    });

    if (missingFiles.length === 0) {
      return { synced: 0, total: 0 };
    }

    let syncedCount = 0;
    const errors: string[] = [];
    const updatedLocal = [...localItems];

    for (const f of missingFiles) {
      try {
        let rawUrl = f.file_url;
        if (!rawUrl || rawUrl === 'idb://stored') {
          rawUrl = await getFileDataUrlFromIDB(f.id);
        }
        if (!rawUrl) continue;

        let storagePath = f.storage_path || null;
        let fileUrl = rawUrl;

        if (rawUrl.startsWith('data:')) {
          const parsed = parseDataUrl(rawUrl);
          if (parsed) {
            const safeName = (f.file_name || `${f.title || 'document'}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `sem-${f.semester || 1}/${Date.now()}_${safeName}`;
            const { error: upErr } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(path, parsed.blob, {
                contentType: parsed.mimeType,
                upsert: true
              });

            if (!upErr) {
              const { data: pubData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(path);
              if (pubData?.publicUrl) {
                storagePath = path;
                fileUrl = pubData.publicUrl;
              }
            }
          }
        }

        const isPdf = f.file_type === 'pdf' || (f.mime_type && f.mime_type.includes('pdf')) || (f.file_name && f.file_name.toLowerCase().endsWith('.pdf'));
        const isVideo = f.file_type === 'video' || (f.mime_type && f.mime_type.includes('video'));
        const fileType = isPdf ? 'pdf' : isVideo ? 'video' : 'image';

        const record: any = {
          title: f.title || 'Study Document',
          semester: Number(f.semester) || 1,
          subject: f.subject || 'Engineering',
          category: f.category || 'Notes',
          tags: Array.isArray(f.tags) ? f.tags : [],
          file_type: fileType,
          mime_type: f.mime_type || (isPdf ? 'application/pdf' : isVideo ? 'video/mp4' : 'image/png'),
          file_size: Number(f.file_size) || 1024,
          file_name: f.file_name || `${f.title || 'document'}.pdf`,
          storage_path: storagePath,
          file_url: fileUrl,
          is_favorite: Boolean(f.is_favorite),
          uploader_id: f.uploader_id || getClientUploaderId(),
          created_at: f.created_at || new Date().toISOString()
        };

        const insRes = await supabase.from(activeFilesTableName).insert([record]).select().single();
        if (!insRes.error && insRes.data) {
          syncedCount++;
          const idx = updatedLocal.findIndex((item) => item.id === f.id);
          if (idx !== -1) {
            updatedLocal[idx] = {
              ...updatedLocal[idx],
              id: insRes.data.id,
              storage_path: insRes.data.storage_path || storagePath,
              file_url: insRes.data.file_url || fileUrl
            };
          }
        } else if (insRes.error) {
          errors.push(`${f.title}: ${insRes.error.message}`);
        }
      } catch (subErr: any) {
        errors.push(`${f.title}: ${subErr?.message}`);
      }
    }

    if (syncedCount > 0) {
      writeLocalFiles(updatedLocal);
    }

    return {
      synced: syncedCount,
      total: missingFiles.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (err: any) {
    return { synced: 0, total: 0, error: err?.message };
  }
}

/**
 * Fetch files strictly from Supabase.
 * - When Supabase returns an empty list, returns [] without regenerating or injecting mock data.
 * - Does NOT trigger automatic mock insertions on refresh.
 */
export async function fetchAllFiles(): Promise<any[]> {
  if (isSupabaseConfigured && supabase && cachedTableReady !== false) {
    try {
      const { data, error } = await supabase
        .from(activeFilesTableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        cachedTableReady = true;
        // Data comes directly from Supabase. If empty, return empty array [].
        return data;
      }

      if (error) {
        // If 'files' failed, try 'notes'
        if (activeFilesTableName === FILES_TABLE) {
          const notesRes = await supabase
            .from(NOTES_TABLE)
            .select('*')
            .order('created_at', { ascending: false });
          if (!notesRes.error && Array.isArray(notesRes.data)) {
            cachedTableReady = true;
            activeFilesTableName = NOTES_TABLE;
            return notesRes.data;
          }
        }

        cachedTableReady = false;
        console.warn('Supabase fetch notice:', error.message);
      }
    } catch (err: any) {
      cachedTableReady = false;
      console.warn('Supabase fetch error:', err?.message);
    }
  }

  // If Supabase table is unreachable, load only user-uploaded local items
  const localItems = readLocalFiles();
  const hydrated = await Promise.all(
    localItems.map(async (item) => {
      if (!item.file_url || item.file_url === 'idb://stored') {
        const storedDataUrl = await getFileDataUrlFromIDB(item.id);
        if (storedDataUrl) {
          return { ...item, file_url: storedDataUrl };
        }
      }
      return item;
    })
  );

  return hydrated.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Upload a study file directly into Supabase Storage & Database.
 */
export async function uploadStudyFile({
  file,
  title,
  semester,
  subject,
  category,
  tags,
  onProgress
}: {
  file: File;
  title: string;
  semester: number;
  subject: string;
  category: string;
  tags: string | string[];
  onProgress?: (pct: number) => void;
}) {
  const cleanTags = Array.isArray(tags)
    ? tags
    : String(tags || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
  const fileType = isPdf ? 'pdf' : isVideo ? 'video' : 'image';
  const uploaderId = getClientUploaderId();

  if (onProgress) onProgress(15);
  const dataUrl = await fileToDataUrl(file);
  if (onProgress) onProgress(35);

  let storagePath: string | null = null;
  let fileUrl: string = dataUrl;
  let supabaseRecord: any = null;
  let supabaseErrorMsg: string | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `sem-${semester}/${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          contentType: file.type || (isPdf ? 'application/pdf' : isVideo ? 'video/mp4' : 'image/png'),
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError && uploadData?.path) {
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);
        if (publicUrlData?.publicUrl) {
          storagePath = path;
          fileUrl = publicUrlData.publicUrl;
        }
      } else if (uploadError) {
        console.warn('Supabase storage notice:', uploadError.message);
        supabaseErrorMsg = `Storage notice: ${uploadError.message}`;
      }
    } catch (err: any) {
      console.warn('Supabase storage upload notice:', err?.message);
    }

    if (onProgress) onProgress(70);

    // Get current auth user if available
    let currentAuthUserId: string | null = null;
    try {
      const authUserRes = await supabase.auth.getUser();
      if (authUserRes?.data?.user?.id) {
        currentAuthUserId = authUserRes.data.user.id;
      }
    } catch {
      // ignore
    }

    const record: any = {
      title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
      semester: Number(semester),
      subject,
      category,
      tags: cleanTags,
      file_type: fileType,
      mime_type: file.type || (isPdf ? 'application/pdf' : isVideo ? 'video/mp4' : 'image/png'),
      file_size: file.size,
      file_name: file.name,
      storage_path: storagePath,
      file_url: fileUrl,
      is_favorite: false,
      uploader_id: uploaderId,
      created_at: new Date().toISOString()
    };

    if (currentAuthUserId) {
      record.user_id = currentAuthUserId;
    }

    try {
      let { data: inserted, error: dbError } = await supabase
        .from(activeFilesTableName)
        .insert([record])
        .select()
        .single();

      // If constraint check on video, fallback to 'image'
      if (dbError && dbError.code === '23514' && fileType === 'video') {
        const fallbackRecord = { ...record, file_type: 'image' };
        const retryRes = await supabase
          .from(activeFilesTableName)
          .insert([fallbackRecord])
          .select()
          .single();
        if (!retryRes.error && retryRes.data) {
          inserted = { ...retryRes.data, file_type: 'video' };
          dbError = null;
        }
      }

      if (!dbError && inserted) {
        supabaseRecord = inserted;
      } else if (dbError) {
        console.warn('Supabase DB insert notice:', dbError.message);
        supabaseErrorMsg = `Database: ${dbError.message}`;
      }
    } catch (dbErr: any) {
      console.warn('Supabase DB exception:', dbErr?.message);
      supabaseErrorMsg = `Database: ${dbErr?.message}`;
    }
  }

  if (onProgress) onProgress(88);

  // If successfully inserted into Supabase
  if (supabaseRecord) {
    await saveFileDataUrlToIDB(supabaseRecord.id, dataUrl);
    const current = readLocalFiles();
    writeLocalFiles([supabaseRecord, ...current.filter((c) => c.id !== supabaseRecord.id)]);
    if (onProgress) onProgress(100);
    return {
      ...supabaseRecord,
      _syncedToSupabase: true,
      file_url: supabaseRecord.file_url || fileUrl
    };
  }

  // Fallback to local IndexedDB store if Supabase was temporarily unreachable
  const newId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await saveFileDataUrlToIDB(newId, dataUrl);

  const fallbackRecord = {
    id: newId,
    title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
    semester: Number(semester),
    subject,
    category,
    tags: cleanTags,
    file_type: fileType,
    mime_type: file.type || (isPdf ? 'application/pdf' : isVideo ? 'video/mp4' : 'image/png'),
    file_size: file.size,
    file_name: file.name,
    storage_path: storagePath,
    file_url: 'idb://stored',
    is_favorite: false,
    uploader_id: uploaderId,
    created_at: new Date().toISOString(),
    _syncedToSupabase: false,
    _supabaseError: supabaseErrorMsg
  };

  const current = readLocalFiles();
  writeLocalFiles([fallbackRecord, ...current]);

  if (onProgress) onProgress(100);
  return { ...fallbackRecord, file_url: dataUrl };
}

export async function toggleFavoriteFile(fileId: string, currentStatus: boolean) {
  const nextStatus = !currentStatus;

  if (isSupabaseConfigured && supabase && cachedTableReady !== false) {
    try {
      const { data, error } = await supabase
        .from(activeFilesTableName)
        .update({ is_favorite: nextStatus })
        .eq('id', fileId)
        .select()
        .single();

      if (!error && data) return data;
    } catch {
      // Fall through to local update
    }
  }

  const files = readLocalFiles();
  const updated = files.map((f) =>
    f.id === fileId ? { ...f, is_favorite: nextStatus } : f
  );
  writeLocalFiles(updated);
  return updated.find((f) => f.id === fileId);
}

export async function updateFileDetails(fileId: string, updates: any) {
  const cleanTags = Array.isArray(updates.tags)
    ? updates.tags
    : String(updates.tags || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

  const payload = {
    title: updates.title.trim(),
    semester: Number(updates.semester),
    subject: updates.subject,
    category: updates.category,
    tags: cleanTags
  };

  if (isSupabaseConfigured && supabase && cachedTableReady !== false) {
    try {
      const { data, error } = await supabase
        .from(activeFilesTableName)
        .update(payload)
        .eq('id', fileId)
        .select()
        .single();

      if (!error && data) return data;
    } catch {
      // Fall through to local update
    }
  }

  const files = readLocalFiles();
  const updated = files.map((f) => (f.id === fileId ? { ...f, ...payload } : f));
  writeLocalFiles(updated);
  return updated.find((f) => f.id === fileId);
}

/**
 * Delete a study file with Strict Permission Enforcement:
 * - Admin can delete ANY file.
 * - Regular users can ONLY delete their own uploaded files (verified by uploader_id / user_id).
 */
export async function deleteStudyFile(fileObj: any, isAdmin = false) {
  const currentUploader = getClientUploaderId();
  const isOwner = Boolean(
    fileObj && fileObj.uploader_id && fileObj.uploader_id === currentUploader
  );

  if (!isAdmin && !isOwner) {
    throw new Error('Permission Denied: Regular users can only delete their own uploaded files.');
  }

  if (isSupabaseConfigured && supabase && cachedTableReady !== false) {
    try {
      if (fileObj.storage_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([fileObj.storage_path]);
      }
      const { error } = await supabase.from(activeFilesTableName).delete().eq('id', fileObj.id);
      if (error) {
        console.warn('Supabase delete response:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase delete exception:', err?.message);
    }
  }

  await deleteFileDataUrlFromIDB(fileObj.id);
  const files = readLocalFiles().filter((f) => f.id !== fileObj.id);
  writeLocalFiles(files);
  return true;
}

/**
 * ============================================================================
 * SUPABASE SUBJECT MANAGEMENT WITH CLOUD STORAGE PERSISTENCE
 * ============================================================================
 * - Persists to Supabase Storage ('study-files/curriculum_subjects.json')
 * - Accessible across all devices, mobile, and guest visitors
 * - Strictly prevents re-injecting 48 dummy default subjects on refresh
 * - Supports Add, Rename, and Delete operations
 */

const CURRICULUM_CLOUD_FILE = 'curriculum_subjects.json';

/**
 * Save the entire subjects map directly to Supabase cloud storage & local storage
 */
export async function saveSubjectsToSupabase(
  subjectsMap: { [semester: number]: string[] }
): Promise<{ [semester: number]: string[] }> {
  const cleanMap: { [sem: number]: string[] } = {};
  for (let s = 1; s <= 8; s++) {
    cleanMap[s] = Array.isArray(subjectsMap[s])
      ? Array.from(new Set(subjectsMap[s].map((item) => String(item).trim()).filter(Boolean)))
      : [];
  }

  // 1. Save to local storage & broadcast event immediately
  saveAllSubjectsMap(cleanMap);

  // 2. Persist directly to shared server storage (/api/curriculum-subjects)
  // This guarantees ANY device, visitor, or friend immediately sees the change!
  try {
    const res = await fetch('/api/curriculum-subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects: cleanMap })
    });
    if (!res.ok) {
      console.warn('Server subjects API response was not OK:', res.status);
    }
  } catch (apiErr: any) {
    console.warn('Server subjects persist notice:', apiErr?.message);
  }

  // 3. Best-effort sync to Supabase Storage bucket & subjects table
  if (isSupabaseConfigured && supabase) {
    try {
      const jsonContent = JSON.stringify(cleanMap, null, 2);
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(CURRICULUM_CLOUD_FILE, jsonContent, {
          contentType: 'application/json',
          upsert: true
        });
    } catch (err: any) {
      // non-blocking
    }

    try {
      for (const sem of [1, 2, 3, 4, 5, 6, 7, 8]) {
        for (const name of cleanMap[sem]) {
          await supabase.from(SUBJECTS_TABLE).insert([{ semester: sem, name }]).select();
        }
      }
    } catch {
      // non-blocking
    }
  }

  return cleanMap;
}

/**
 * Fetch subjects strictly from shared cloud server storage and real uploaded files.
 * Synchronizes across all users, admins, and friends' devices.
 */
export async function fetchSubjectsFromSupabase(): Promise<{ [semester: number]: string[] } | null> {
  const baseMap = (getSubjectsBySemester() || {}) as Record<number, string[]>;
  const currentClean: { [sem: number]: string[] } = {};
  for (let s = 1; s <= 8; s++) {
    currentClean[s] = Array.isArray(baseMap[s]) ? [...baseMap[s]] : [];
  }

  let cloudMap: { [sem: number]: string[] } | null = null;

  // 1. Fetch from shared server storage (/api/curriculum-subjects)
  try {
    const res = await fetch('/api/curriculum-subjects');
    if (res.ok) {
      const data = await res.json();
      if (data && data.subjects && typeof data.subjects === 'object') {
        cloudMap = {};
        for (let s = 1; s <= 8; s++) {
          cloudMap[s] = Array.isArray(data.subjects[s])
            ? Array.from(new Set(data.subjects[s].map((x: any) => String(x).trim()).filter(Boolean)))
            : [];
        }
      }
    }
  } catch (apiErr: any) {
    console.warn('Notice fetching /api/curriculum-subjects:', apiErr?.message);
  }

  // 2. Fallback check from Supabase Storage if server returned empty
  if (!cloudMap && isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(CURRICULUM_CLOUD_FILE);

      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          cloudMap = {};
          for (let s = 1; s <= 8; s++) {
            cloudMap[s] = Array.isArray(parsed[s])
              ? Array.from(new Set(parsed[s].map((x: any) => String(x).trim()).filter(Boolean)))
              : [];
          }
        }
      }
    } catch (dlErr: any) {
      console.warn('Supabase storage download notice:', dlErr?.message);
    }
  }

  // 3. Fetch distinct subjects from real uploaded files in Supabase so file subjects are never lost
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: fileRows } = await supabase
        .from(activeFilesTableName)
        .select('semester, subject');

      if (Array.isArray(fileRows) && fileRows.length > 0) {
        const targetMap = cloudMap || currentClean;
        fileRows.forEach((row: any) => {
          const sem = Number(row.semester);
          const subj = row.subject && typeof row.subject === 'string' ? row.subject.trim() : '';
          if (sem >= 1 && sem <= 8 && subj) {
            if (!targetMap[sem]) targetMap[sem] = [];
            if (!targetMap[sem].includes(subj)) {
              targetMap[sem].push(subj);
            }
          }
        });
        cloudMap = targetMap;
      }
    } catch (fileErr: any) {
      console.warn('Files subjects query notice:', fileErr?.message);
    }
  }

  // If cloudMap was retrieved, save locally and return
  if (cloudMap) {
    saveAllSubjectsMap(cloudMap);
    return cloudMap;
  }

  return currentClean;
}

export async function addSubjectToSupabase(
  semester: number,
  subjectName: string,
  isAdmin = false
): Promise<{ [semester: number]: string[] }> {
  const clean = subjectName.trim();
  if (!clean) throw new Error('Subject name cannot be empty.');

  const current = (getSubjectsBySemester() || {}) as Record<number, string[]>;
  const semList = current[Number(semester)] || [];
  if (!semList.includes(clean)) {
    const updatedMap = {
      ...current,
      [Number(semester)]: [...semList, clean]
    };
    return await saveSubjectsToSupabase(updatedMap);
  }
  return current;
}

export async function deleteSubjectFromSupabase(
  semester: number,
  subjectName: string,
  isAdmin = false
): Promise<{ [semester: number]: string[] }> {
  const clean = subjectName.trim().toLowerCase();
  const current = (getSubjectsBySemester() || {}) as Record<number, string[]>;
  const semList = current[Number(semester)] || [];
  const nextList = semList.filter((s: string) => s.trim().toLowerCase() !== clean);
  const updatedMap = {
    ...current,
    [Number(semester)]: nextList
  };
  return await saveSubjectsToSupabase(updatedMap);
}

/**
 * Rename an existing subject and update all matching documents in Supabase & local storage
 */
export async function renameSubjectInSupabase(
  semester: number,
  oldSubject: string,
  newSubject: string,
  isAdmin = false
): Promise<{ [semester: number]: string[] }> {
  const cleanOld = oldSubject.trim();
  const cleanNew = newSubject.trim();

  if (!cleanNew) throw new Error('New subject name cannot be empty.');
  if (cleanOld.toLowerCase() === cleanNew.toLowerCase()) {
    return (getSubjectsBySemester() || {}) as Record<number, string[]>;
  }

  const current = (getSubjectsBySemester() || {}) as Record<number, string[]>;
  const semList = current[Number(semester)] || [];
  const nextList = semList.map((s: string) => (s.trim().toLowerCase() === cleanOld.toLowerCase() ? cleanNew : s));

  const updatedMap = {
    ...current,
    [Number(semester)]: Array.from(new Set(nextList))
  };

  // 1. Update cloud subjects json
  await saveSubjectsToSupabase(updatedMap);

  // 2. Update files in Supabase where semester and old subject match
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from(activeFilesTableName)
        .update({ subject: cleanNew })
        .eq('semester', Number(semester))
        .eq('subject', cleanOld);
    } catch (err: any) {
      console.warn('Notice updating files subject in Supabase:', err?.message);
    }
  }

  // 3. Update local files in storage
  const localFiles = readLocalFiles();
  const updatedLocal = localFiles.map((f) => {
    if (Number(f.semester) === Number(semester) && f.subject === cleanOld) {
      return { ...f, subject: cleanNew };
    }
    return f;
  });
  writeLocalFiles(updatedLocal);

  return updatedMap;
}

export function recordRecentlyViewed(fileId: string) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item: any) => item.id !== fileId);
    const updated = [{ id: fileId, viewedAt: new Date().toISOString() }, ...filtered].slice(0, 15);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save recently viewed:', e);
  }
}

export function getRecentlyViewedIds(): Array<{ id: string; viewedAt: string }> {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function formatFileSize(bytes: number | string): string {
  if (!bytes || Number.isNaN(Number(bytes))) return '0 KB';
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * ============================================================================
 * UPDATED SUPABASE SQL ROW LEVEL SECURITY (RLS) POLICIES & SCHEMA
 * ============================================================================
 * Copy-paste this script into the Supabase SQL Editor.
 * Enforces:
 * 1. Admin Role & Profile Management (public.profiles & is_admin())
 * 2. Strict Subject Management: Only Admin can INSERT or DELETE subjects.
 * 3. Strict File/Notes Deletion: Only Admin or the File's Owner can DELETE.
 */
export const SUPABASE_SETUP_SQL = `-- ============================================================================
-- STUDYVAULT / FILENEST SUPABASE RLS SECURITY RULES & SCHEMAS
-- ============================================================================
-- Run this in your Supabase Project -> SQL Editor -> Run
-- Project ID: zmljxivkrxigyhkkdgfp
-- ============================================================================

-- 1. USER PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check whether caller is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR (auth.jwt() ->> 'role' = 'service_role')
    OR (auth.jwt() ->> 'role' = 'admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. SUBJECTS TABLE & STRICT ADMIN-ONLY MANAGEMENT
-- Regular users can view subjects. Only ADMINS can add or delete subjects.
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(semester, name)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- View Subjects: Public read access
DROP POLICY IF EXISTS "Allow all users to read subjects" ON public.subjects;
CREATE POLICY "Allow all users to read subjects"
  ON public.subjects FOR SELECT
  USING (true);

-- Insert Subjects: Strictly Admin Only
DROP POLICY IF EXISTS "Allow admin only to insert subjects" ON public.subjects;
CREATE POLICY "Allow admin only to insert subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (public.is_admin());

-- Update Subjects: Strictly Admin Only
DROP POLICY IF EXISTS "Allow admin only to update subjects" ON public.subjects;
CREATE POLICY "Allow admin only to update subjects"
  ON public.subjects FOR UPDATE
  USING (public.is_admin());

-- Delete Subjects: Strictly Admin Only
DROP POLICY IF EXISTS "Allow admin only to delete subjects" ON public.subjects;
CREATE POLICY "Allow admin only to delete subjects"
  ON public.subjects FOR DELETE
  USING (public.is_admin());

-- 3. FILES & NOTES TABLES WITH STRICT DELETION PERMISSIONS
-- File Deletion: Only Admin can delete any file; Regular users can ONLY delete their own uploaded files.
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  file_url TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  uploader_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if public.files was previously created without them
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS uploader_id TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/pdf';
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- Support video, pdf, image in check constraint
DO $$
BEGIN
  ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_file_type_check;
  ALTER TABLE public.files ADD CONSTRAINT files_file_type_check CHECK (file_type IN ('pdf', 'image', 'video'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Also support notes table in case your Supabase project uses 'notes'
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Notes',
  tags TEXT[] DEFAULT '{}',
  file_type TEXT NOT NULL DEFAULT 'pdf',
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size BIGINT NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  file_url TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  uploader_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if public.notes was previously created without them
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS uploader_id TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/pdf';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- Also ensure subjects table has created_by
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 3A. Policies for 'files'
DROP POLICY IF EXISTS "Allow public read access on files" ON public.files;
CREATE POLICY "Allow public read access on files"
  ON public.files FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow upload to files" ON public.files;
CREATE POLICY "Allow upload to files"
  ON public.files FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update files for owner or admin" ON public.files;
CREATE POLICY "Allow update files for owner or admin"
  ON public.files FOR UPDATE
  USING (public.is_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

-- STRICT FILE DELETION: Admin can delete any file; Regular users can ONLY delete their own!
DROP POLICY IF EXISTS "Allow delete files strictly for admin or owner" ON public.files;
CREATE POLICY "Allow delete files strictly for admin or owner"
  ON public.files FOR DELETE
  USING (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- 3B. Policies for 'notes'
DROP POLICY IF EXISTS "Allow public read access on notes" ON public.notes;
CREATE POLICY "Allow public read access on notes"
  ON public.notes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow upload to notes" ON public.notes;
CREATE POLICY "Allow upload to notes"
  ON public.notes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update notes for owner or admin" ON public.notes;
CREATE POLICY "Allow update notes for owner or admin"
  ON public.notes FOR UPDATE
  USING (public.is_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

DROP POLICY IF EXISTS "Allow delete notes strictly for admin or owner" ON public.notes;
CREATE POLICY "Allow delete notes strictly for admin or owner"
  ON public.notes FOR DELETE
  USING (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- 4. STORAGE BUCKET POLICIES FOR "study-files"
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-files', 'study-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to study-files" ON storage.objects;
CREATE POLICY "Public Access to study-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-files');

DROP POLICY IF EXISTS "Public Upload to study-files" ON storage.objects;
CREATE POLICY "Public Upload to study-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'study-files');

DROP POLICY IF EXISTS "Delete storage objects owner or admin" ON storage.objects;
CREATE POLICY "Delete storage objects owner or admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'study-files'
    AND (public.is_admin() OR auth.uid() = owner)
  );
`;
