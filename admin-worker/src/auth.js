import { betterAuth } from 'better-auth';
import { EmailMessage } from 'cloudflare:email';

// Passwords are hashed with PBKDF2 (native WebCrypto, Workers' maximum of 100,000 rounds).
// Better Auth's default scrypt is JavaScript and can exceed Workers' CPU limit.
const enc = new TextEncoder(), hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = h => Uint8Array.from(h.match(/../g).map(x => parseInt(x, 16)));
const derive = async (pw, salt) => crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, await crypto.subtle.importKey('raw', enc.encode(pw.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']), 256);
const hash = async pw => { const salt = crypto.getRandomValues(new Uint8Array(16)); return `${hex(salt)}:${hex(await derive(pw, salt))}`; };
const verify = async ({ hash: h, password }) => { const [s, k] = String(h).split(':'); if (!s || !k) return false; const a = new Uint8Array(await derive(password, unhex(s))), b = unhex(k); let d = a.length ^ b.length; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };

// Reset links go to the admin's own address. Uses Resend if RESEND_API_KEY is set, otherwise Cloudflare Email Routing (send_email binding).
async function sendMail(env, { to, subject, text }) {
  if (to.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) return;
  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }) });
    return;
  }
  const raw = [`From: Portfolio Admin <${env.MAIL_FROM}>`, `To: ${to}`, `Subject: ${subject}`, `Message-ID: <${crypto.randomUUID()}@${env.MAIL_FROM.split('@')[1]}>`, `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', '', text].join('\r\n');
  await env.EMAIL.send(new EmailMessage(env.MAIL_FROM, to, raw));
}

export const makeAuth = (env, ctx, { allowSignUp = false } = {}) => betterAuth({
  database: env.DB,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.ADMIN_ORIGIN,
  trustedOrigins: [env.ADMIN_ORIGIN],
  session: { expiresIn: 3600, updateAge: 3600 }, // signed out 1 hour after login
  rateLimit: { enabled: true, window: 60, max: 30, storage: 'database', customRules: { '/sign-in/email': { window: 300, max: 5 }, '/request-password-reset': { window: 600, max: 3 }, '/reset-password': { window: 600, max: 5 } } },
  advanced: { useSecureCookies: env.ADMIN_ORIGIN.startsWith('https'), defaultCookieAttributes: { sameSite: 'strict', httpOnly: true } },
  emailAndPassword: {
    enabled: true, disableSignUp: !allowSignUp, minPasswordLength: 12, maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true, resetPasswordTokenExpiresIn: 900,
    password: { hash, verify },
    sendResetPassword: async ({ user, url }) => { ctx.waitUntil(sendMail(env, { to: user.email, subject: 'Reset your admin password', text: `Use this link within 15 minutes to choose a new password:\n\n${url}\n\nIf you did not ask for this, ignore this email.` }).catch(e => console.error('mail', e))); }
  }
});
