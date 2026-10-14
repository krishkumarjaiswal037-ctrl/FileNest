/**
 * Admin Authentication & Single-Slot Registration Service
 * (src/lib/adminAuth.ts)
 *
 * Implements:
 * 1. Single-slot admin registration: Only one administrator account can EVER be registered.
 *    Once created, subsequent registration attempts are permanently blocked ("Admin slot is filled").
 * 2. Secure PBKDF2 password hashing with cryptographically random salt (via Web Crypto API).
 * 3. Session management with timestamp and active login state in localStorage.
 * 4. Helper queries to inspect registration status, verify credentials, update profile/password, and log out.
 */

const ADMIN_STORAGE_KEY = 'filenest_admin_account_v1';
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
 * Checks if the single admin slot is registered
 */
export function isAdminRegistered(): boolean {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return false;
    const account = JSON.parse(raw);
    return Boolean(account && account.username && account.hashHex);
  } catch {
    return false;
  }
}

/**
 * Gets the registered admin public metadata (excluding hash & salt)
 */
export function getRegisteredAdminInfo(): {
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLoginAt?: string;
} | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const account: AdminAccount = JSON.parse(raw);
    return {
      username: account.username,
      email: account.email,
      fullName: account.fullName,
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt
    };
  } catch {
    return null;
  }
}

/**
 * Register the SINGLE Admin Slot.
 * Will throw an error if an admin account already exists.
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
  if (isAdminRegistered()) {
    throw new Error(
      'Registration closed. The single administrator slot has already been occupied.'
    );
  }

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

  const account: AdminAccount = {
    username: cleanUser,
    email: cleanEmail,
    fullName: cleanName,
    saltHex,
    hashHex,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(account));

  // Auto-login newly registered admin
  const session: AdminSession = {
    username: account.username,
    email: account.email,
    fullName: account.fullName,
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
 * Log in to the registered admin account
 */
export async function loginAdmin({
  identifier,
  password
}: {
  identifier: string;
  password: string;
}): Promise<AdminSession> {
  const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) {
    throw new Error(
      'No administrator account found. Please initialize the single admin slot first.'
    );
  }

  let account: AdminAccount;
  try {
    account = JSON.parse(raw);
  } catch {
    throw new Error('Admin credentials record corrupted.');
  }

  const cleanId = identifier.trim().toLowerCase();
  const matchId =
    cleanId === account.username.toLowerCase() ||
    cleanId === account.email.toLowerCase();

  if (!matchId) {
    throw new Error('Invalid administrator username or email.');
  }

  const salt = hexToBuffer(account.saltHex);
  const computedHash = await hashPassword(password, salt);

  if (computedHash !== account.hashHex) {
    throw new Error('Incorrect password. Access denied.');
  }

  // Update last login
  account.lastLoginAt = new Date().toISOString();
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(account));

  const session: AdminSession = {
    username: account.username,
    email: account.email,
    fullName: account.fullName,
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
  const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) throw new Error('No administrator account exists.');
  const account: AdminAccount = JSON.parse(raw);

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
  }
  if (email && email.trim() && email.includes('@')) {
    account.email = email.trim().toLowerCase();
  }

  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(account));

  // Sync session
  const session = getAdminSession();
  if (session) {
    session.fullName = account.fullName;
    session.email = account.email;
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }
}
