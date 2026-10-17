/**
 * Admin Authentication & Multi-Account Management Service
 * (src/lib/adminAuth.ts)
 *
 * Capabilities:
 * 1. Multi-Admin Account Support: Allows administrators to register, switch, and log in
 *    with any authorized admin email and password.
 * 2. Secure PBKDF2 password hashing with cryptographically random salt (via Web Crypto API).
 * 3. Cross-device persistence: Synchronizes registered admin accounts with the server
 *    so admins can log in from any device or browser.
 * 4. Account switching and credential reset helpers.
 */

const ADMIN_ACCOUNTS_STORAGE_KEY = 'filenest_admin_accounts_v2';
const ADMIN_LEGACY_KEY = 'filenest_admin_account_v1';
const ADMIN_SESSION_KEY = 'filenest_admin_session_v1';

export interface AdminAccount {
  username: string;
  email: string;
  fullName: string;
  avatarSeed?: string;
  saltHex: string;
  hashHex: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminSession {
  username: string;
  email: string;
  fullName: string;
  loginTime: string;
  token: string;
}

/**
 * Generate cryptographic SHA-256 PBKDF2 hash
 */
async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedKey));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Read all stored admin accounts (with backward compatibility migration)
 */
export function getStoredAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Check legacy single-slot account
    const legacyRaw = localStorage.getItem(ADMIN_LEGACY_KEY);
    if (legacyRaw) {
      const legacyAccount: AdminAccount = JSON.parse(legacyRaw);
      if (legacyAccount && legacyAccount.username && legacyAccount.hashHex) {
        const migrated = [legacyAccount];
        localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (err) {
    console.warn('Error reading admin accounts:', err);
  }
  return [];
}

function saveStoredAdminAccounts(accounts: AdminAccount[]): void {
  try {
    localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    if (accounts.length > 0) {
      // Keep legacy key updated with the primary account for backwards compatibility
      localStorage.setItem(ADMIN_LEGACY_KEY, JSON.stringify(accounts[0]));
    } else {
      localStorage.removeItem(ADMIN_LEGACY_KEY);
    }
  } catch (err) {
    console.warn('Error saving admin accounts to storage:', err);
  }
}

/**
 * Checks if at least one admin account is registered
 */
export function isAdminRegistered(): boolean {
  return getStoredAdminAccounts().length > 0;
}

/**
 * Gets the primary registered admin public metadata
 */
export function getRegisteredAdminInfo(): {
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLoginAt?: string;
} | null {
  const list = getStoredAdminAccounts();
  if (list.length === 0) return null;
  const primary = list[0];
  return {
    username: primary.username,
    email: primary.email,
    fullName: primary.fullName,
    createdAt: primary.createdAt,
    lastLoginAt: primary.lastLoginAt
  };
}

/**
 * Gets all registered admin public accounts (excluding hash & salt)
 */
export function getRegisteredAdminAccounts(): Array<{
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLoginAt?: string;
}> {
  return getStoredAdminAccounts().map((a) => ({
    username: a.username,
    email: a.email,
    fullName: a.fullName,
    createdAt: a.createdAt,
    lastLoginAt: a.lastLoginAt
  }));
}

/**
 * Register a new Admin account or update credentials for an existing email/username.
 * Saves locally and syncs to shared cloud server so admin can log in from any device.
 */
export async function registerAdminAccount({
  username,
  email,
  fullName,
  password
}: {
  username: string;
  email: string;
  fullName: string;
  password: string;
}): Promise<AdminSession> {
  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim() || cleanUser;

  if (cleanUser.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // Generate random 16-byte salt
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltHex = bufferToHex(salt);
  const hashHex = await hashPassword(password, salt);

  const newAccount: AdminAccount = {
    username: cleanUser,
    email: cleanEmail,
    fullName: cleanName,
    saltHex,
    hashHex,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  const existing = getStoredAdminAccounts();
  // Filter out any prior entry matching this username or email
  const filtered = existing.filter(
    (a) => a.username.toLowerCase() !== cleanUser && a.email.toLowerCase() !== cleanEmail
  );
  const updatedAccounts = [newAccount, ...filtered];
  saveStoredAdminAccounts(updatedAccounts);

  // Sync to shared server backend
  try {
    fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: newAccount })
    }).catch(() => {});
  } catch {
    // non-blocking
  }

  // Create and persist active admin session
  const session: AdminSession = {
    username: newAccount.username,
    email: newAccount.email,
    fullName: newAccount.fullName,
    loginTime: new Date().toISOString(),
    token: `fn_adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: session }));
  }
  return session;
}

/**
 * Log in to any registered admin account via email or username
 */
export async function loginAdmin({
  identifier,
  password
}: {
  identifier: string;
  password: string;
}): Promise<AdminSession> {
  const cleanId = identifier.trim().toLowerCase();
  let accounts = getStoredAdminAccounts();

  // 1. Try finding account and verifying password locally first
  let matchAccount = accounts.find(
    (a) => a.username.toLowerCase() === cleanId || a.email.toLowerCase() === cleanId
  );

  if (matchAccount) {
    try {
      const salt = hexToBuffer(matchAccount.saltHex);
      const computedHash = await hashPassword(password, salt);
      if (computedHash === matchAccount.hashHex) {
        matchAccount.lastLoginAt = new Date().toISOString();
        saveStoredAdminAccounts(accounts);

        const session: AdminSession = {
          username: matchAccount.username,
          email: matchAccount.email,
          fullName: matchAccount.fullName,
          loginTime: new Date().toISOString(),
          token: `fn_adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        };

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: session }));
        }
        return session;
      }
    } catch {
      // local hash comparison error, proceed to server check
    }
  }

  // 2. Try server-side verification via /api/admin/login (essential for other devices/emails)
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.session) {
        const session: AdminSession = data.session;
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

        // If server provided full account details, cache locally for offline access
        if (data.account && data.account.hashHex) {
          const current = getStoredAdminAccounts();
          const filtered = current.filter(
            (a) =>
              a.username.toLowerCase() !== data.account.username.toLowerCase() &&
              a.email.toLowerCase() !== data.account.email.toLowerCase()
          );
          saveStoredAdminAccounts([data.account, ...filtered]);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: session }));
        }
        return session;
      }
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        throw new Error(errData.error);
      }
    }
  } catch (netErr: any) {
    if (netErr?.message && !netErr.message.includes('fetch')) {
      throw netErr;
    }
  }

  if (matchAccount) {
    throw new Error('Incorrect password. Please verify your credentials and try again.');
  }

  throw new Error(
    `No administrator account found for "${identifier}". You can register this email in the "Register Another Admin" tab.`
  );
}

/**
 * Reset all registered admin accounts (allows completely fresh registration)
 */
export async function resetAllAdminAccounts(): Promise<void> {
  try {
    localStorage.removeItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(ADMIN_LEGACY_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: null }));
    }
    try {
      fetch('/api/admin/reset', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Error resetting admin accounts:', err);
  }
}

/**
 * Get current active admin session, or null if logged out
 */
export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.token) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: null }));
    }
  } catch {
    // ignore
  }
}

/**
 * Update Admin Profile details or password (must be authenticated)
 */
export async function updateAdminCredentials({
  fullName,
  email,
  currentPassword,
  newPassword
}: {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<void> {
  const session = getAdminSession();
  if (!session) throw new Error('You must be signed in as an administrator.');

  const accounts = getStoredAdminAccounts();
  const account = accounts.find(
    (a) => a.username.toLowerCase() === session.username.toLowerCase() || a.email.toLowerCase() === session.email.toLowerCase()
  );

  if (!account) throw new Error('Administrator account record not found.');

  if (currentPassword && newPassword) {
    const salt = hexToBuffer(account.saltHex);
    const computedHash = await hashPassword(currentPassword, salt);
    if (computedHash !== account.hashHex) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    const newSalt = new Uint8Array(16);
    crypto.getRandomValues(newSalt);
    account.saltHex = bufferToHex(newSalt);
    account.hashHex = await hashPassword(newPassword, newSalt);
  }

  if (fullName && fullName.trim()) {
    account.fullName = fullName.trim();
    session.fullName = account.fullName;
  }
  if (email && email.trim() && email.includes('@')) {
    account.email = email.trim().toLowerCase();
    session.email = account.email;
  }

  saveStoredAdminAccounts(accounts);
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

  try {
    fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account })
    }).catch(() => {});
  } catch {
    // non-blocking
  }
}
