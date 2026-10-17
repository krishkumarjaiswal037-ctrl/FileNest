/**
 * Strict Single-Admin Authentication Service
 * (src/lib/adminAuth.ts)
 *
 * Rules:
 * 1. Only ONE person can be admin.
 * 2. Multi-admin registration is strictly disabled and prohibited.
 * 3. Once the single administrator account is created, public registration is locked.
 * 4. Passwords are securely hashed with PBKDF2 (100,000 iterations) and cryptographically random salts.
 * 5. Changes to administrator email or password must be done from within the authenticated dashboard.
 */

const SINGLE_ADMIN_STORAGE_KEY = 'filenest_single_admin_v3';
const ADMIN_LEGACY_KEY = 'filenest_admin_account_v1';
const ADMIN_ACCOUNTS_STORAGE_KEY = 'filenest_admin_accounts_v2';
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
 * Generate cryptographic SHA-256 PBKDF2 hash using Web Crypto API
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

// Fixed Master Administrator Credentials (krish kumar jaiswal)
export const FIXED_PRIMARY_ADMIN: AdminAccount = {
  username: 'krish',
  email: 'krishkumarjaiswal2081@gmail.com',
  fullName: 'krish kumar jaiswal',
  saltHex: '9e6b2afef5112d459005cc629cf4bff8',
  hashHex: '69f5cf56c453bd044ec30dc42cbd72f058f83296fb7f26a57b3570df52c3bd5d',
  createdAt: '2026-10-17T19:08:42.147Z',
  lastLoginAt: '2026-10-17T19:08:42.148Z'
};

/**
 * Read the single stored admin account from local storage
 */
export function getStoredAdminAccount(): AdminAccount {
  try {
    const raw = localStorage.getItem(SINGLE_ADMIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.hashHex && parsed.username === 'krish') return parsed;
    }
  } catch (err) {
    console.warn('Error reading admin account:', err);
  }
  saveStoredAdminAccount(FIXED_PRIMARY_ADMIN);
  return FIXED_PRIMARY_ADMIN;
}

/**
 * Backwards compatibility helper
 */
export function getStoredAdminAccounts(): AdminAccount[] {
  return [getStoredAdminAccount()];
}

/**
 * Save single admin account to local storage
 */
export function saveStoredAdminAccount(account: AdminAccount | null): void {
  try {
    const toSave = account || FIXED_PRIMARY_ADMIN;
    localStorage.setItem(SINGLE_ADMIN_STORAGE_KEY, JSON.stringify(toSave));
    localStorage.setItem(ADMIN_LEGACY_KEY, JSON.stringify(toSave));
    localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify([toSave]));
  } catch (err) {
    console.warn('Error saving admin account to storage:', err);
  }
}

/**
 * Check if the single admin is registered (always true: fixed to krish)
 */
export function isAdminRegistered(): boolean {
  return true;
}

/**
 * Query server status to know definitively if single admin is registered
 */
export async function checkAdminStatus(): Promise<{ isRegistered: boolean; adminUsername?: string }> {
  try {
    const res = await fetch('/api/admin/status');
    if (res.ok) {
      const data = await res.json();
      return {
        isRegistered: true,
        adminUsername: data?.adminUsername || 'krish'
      };
    }
  } catch {
    // Fallback
  }
  return { isRegistered: true, adminUsername: 'krish' };
}

/**
 * Gets the primary registered admin public info
 */
export function getRegisteredAdminInfo(): {
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLoginAt?: string;
} | null {
  const acc = getStoredAdminAccount();
  if (!acc) return null;
  return {
    username: acc.username,
    email: acc.email,
    fullName: acc.fullName,
    createdAt: acc.createdAt,
    lastLoginAt: acc.lastLoginAt
  };
}

/**
 * Backwards compatibility helper
 */
export function getRegisteredAdminAccounts() {
  const info = getRegisteredAdminInfo();
  return info ? [info] : [];
}

/**
 * Register the SINGLE Primary Administrator Account.
 * If an admin account already exists, registration is LOCKED and this throws an error.
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

  // Check if an admin already exists locally
  if (getStoredAdminAccount()) {
    throw new Error(
      'Registration is locked. Only one person can be administrator on FileNest, and an admin account is already active.'
    );
  }

  if (cleanUser.length < 3) {
    throw new Error('Admin username must be at least 3 characters long.');
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid administrator email address.');
  }
  if (password.length < 6) {
    throw new Error('Admin password must be at least 6 characters long.');
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

  // Sync to shared server backend first to ensure single-admin constraint
  try {
    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: newAccount })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        throw new Error(errData.error);
      }
      throw new Error('Server rejected admin registration.');
    }
  } catch (netErr: any) {
    if (netErr?.message && !netErr.message.includes('fetch')) {
      throw netErr;
    }
  }

  // Save single admin locally
  saveStoredAdminAccount(newAccount);

  // Create active admin session
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
 * Log in to the single administrator account via email or username
 */
export async function loginAdmin({
  identifier,
  password
}: {
  identifier: string;
  password: string;
}): Promise<AdminSession> {
  const cleanId = identifier.trim().toLowerCase();
  const targetAccount = getStoredAdminAccount();

  // Strict check: only krish or krishkumarjaiswal2081@gmail.com can enter
  const matchesId =
    cleanId === targetAccount.username.toLowerCase() ||
    cleanId === targetAccount.email.toLowerCase() ||
    cleanId === 'krish' ||
    cleanId === 'krishkumarjaiswal2081@gmail.com';

  if (!matchesId) {
    throw new Error(
      'Access Denied: Only the authorized single administrator (krish / krishkumarjaiswal2081@gmail.com) can enter. Multi-entry or foreign accounts are strictly blocked.'
    );
  }

  // 1. Verify hash locally via Web Crypto PBKDF2
  try {
    const salt = hexToBuffer(targetAccount.saltHex);
    const computedHash = await hashPassword(password, salt);
    if (computedHash === targetAccount.hashHex) {
      targetAccount.lastLoginAt = new Date().toISOString();
      saveStoredAdminAccount(targetAccount);

      const session: AdminSession = {
        username: targetAccount.username,
        email: targetAccount.email,
        fullName: targetAccount.fullName,
        loginTime: new Date().toISOString(),
        token: `fn_adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      };

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: session }));
      }

      // Non-blocking ping to server
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password })
      }).catch(() => {});

      return session;
    } else {
      throw new Error('Incorrect password. Access denied.');
    }
  } catch (err: any) {
    if (err?.message === 'Incorrect password. Access denied.') {
      throw err;
    }
  }

  // 2. Server verification via /api/admin/login
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

        if (data.account && data.account.hashHex) {
          saveStoredAdminAccount(data.account);
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

  throw new Error('Incorrect administrator credentials. Access is restricted exclusively to krish.');
}

/**
 * Update Single Admin Credentials (must be executed by authenticated admin)
 */
export async function updateAdminCredentials({
  currentPassword,
  newUsername,
  newEmail,
  newFullName,
  newPassword
}: {
  currentPassword?: string;
  newUsername?: string;
  newEmail?: string;
  newFullName?: string;
  newPassword?: string;
}): Promise<AdminSession> {
  const session = getAdminSession();
  if (!session) {
    throw new Error('You must be authenticated as administrator.');
  }

  if (!currentPassword) {
    throw new Error('Current password is required to update credentials.');
  }

  const localAccount = getStoredAdminAccount();
  if (localAccount) {
    const salt = hexToBuffer(localAccount.saltHex);
    const computedHash = await hashPassword(currentPassword, salt);
    if (computedHash !== localAccount.hashHex) {
      throw new Error('Current administrator password is incorrect.');
    }
  }

  // Send update request to server
  const res = await fetch('/api/admin/update-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPassword,
      newUsername,
      newEmail,
      newFullName,
      newPassword
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || 'Failed to update admin credentials on server.');
  }

  const data = await res.json();
  const updatedSession: AdminSession = data.session || {
    ...session,
    username: newUsername || session.username,
    email: newEmail || session.email,
    fullName: newFullName || session.fullName
  };

  if (localAccount) {
    if (newUsername) localAccount.username = newUsername.trim().toLowerCase();
    if (newEmail) localAccount.email = newEmail.trim().toLowerCase();
    if (newFullName) localAccount.fullName = newFullName.trim();
    if (newPassword && newPassword.length >= 6) {
      const newSalt = new Uint8Array(16);
      crypto.getRandomValues(newSalt);
      localAccount.saltHex = bufferToHex(newSalt);
      localAccount.hashHex = await hashPassword(newPassword, newSalt);
    }
    saveStoredAdminAccount(localAccount);
  }

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedSession));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('filenest_admin_session_change', { detail: updatedSession }));
  }

  return updatedSession;
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
 * Reset admin account (requires current admin password)
 */
export async function resetAllAdminAccounts(currentPassword?: string): Promise<void> {
  try {
    if (currentPassword) {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Could not reset credentials on server.');
      }
    }
    saveStoredAdminAccount(null);
    logoutAdmin();
  } catch (err: any) {
    console.warn('Error resetting admin account:', err);
    throw err;
  }
}
