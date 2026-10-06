import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { candidateProfile, user } from "./db/schema";
import { actionEmail, codeEmail, sendEmail } from "./email";

const isProduction = process.env.NODE_ENV === "production";

function hostOf(value: string | undefined) {
  if (!value?.trim()) return undefined;
  try {
    return new URL(value.trim()).host;
  } catch {
    return undefined;
  }
}

// The canonical public URL (production domain). Also used as the fallback
// base URL when a request arrives on a host that is not allowed.
const canonicalUrl = process.env.BETTER_AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined;

// Better Auth resolves its base URL per request from this allowlist, so the
// same build works on localhost, a LAN address, a dev tunnel, Vercel preview
// deployments and the production domain without the browser and server
// disagreeing about which origin they are on.
const allowedHosts = Array.from(new Set([
  hostOf(canonicalUrl),
  hostOf(process.env.NEXT_PUBLIC_APP_URL),
  process.env.VERCEL_URL?.trim(),
  process.env.VERCEL_BRANCH_URL?.trim(),
  process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
  // Netlify: the site's main address and the address of each deploy preview
  hostOf(process.env.URL),
  hostOf(process.env.DEPLOY_PRIME_URL),
  ...(process.env.AUTH_ALLOWED_HOSTS ?? "").split(",").map(host => host.trim()),
  // Loopback is always allowed so a local `next start` can be smoke-tested.
  "localhost:*",
  "127.0.0.1:*",
  ...(isProduction ? [] : ["192.168.*.*:*", "10.*.*.*:*", "*.trycloudflare.com"]),
].filter((host): host is string => Boolean(host))));

export const auth = betterAuth({
  baseURL: {
    allowedHosts,
    fallback: canonicalUrl,
    // Production behind an HTTPS address: always https. Netlify hands route
    // handlers an http:// request URL while the proxy only sees headers, so
    // "auto" gave them different cookie names and dashboards bounced to sign-in.
    // Otherwise the request's own scheme in production (http on loopback), and
    // always http in development so cookie names match on localhost, LAN
    // addresses and tunnels alike.
    protocol: !isProduction ? "http" : canonicalUrl?.startsWith("https://") ? "https" : "auto",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    // Accounts must confirm their email with a one-time code before signing in
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    // Also how guest applicants claim the passwordless account created for them:
    // the reset link proves they own the email, then a password login is added.
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(actionEmail({
        to: user.email,
        subject: "Set your ADDOZ password",
        greeting: `Hi ${user.name || "there"},`,
        body: "Use the button below to set a new password for your ADDOZ account. The link works once and expires in 1 hour.",
        actionLabel: "Set password",
        actionUrl: url,
        footer: "If you didn't ask for this, you can ignore this email — your account is unchanged.",
      }));
    },
    onPasswordReset: async ({ user: resetUser }) => {
      // Following the emailed link proves ownership of the address
      await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, resetUser.id));
    },
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    // The code is sent on registration, and again when an unverified account tries to sign in
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 10 * 60,
      allowedAttempts: 5,
      // Use 6-digit codes (not links) for email verification
      overrideDefaultEmailVerification: true,
      // Codes are only for verifying an existing account, never for creating one
      disableSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification") return;
        await sendEmail(codeEmail({ to: email, code: otp }));
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: ["candidate", "employer", "admin"],
        required: false,
        defaultValue: "candidate",
        // Roles are authorization claims. They must never be accepted through
        // Better Auth's public sign-up or update endpoints.
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Direct requests to Better Auth's public sign-up endpoint always
        // receive the server-owned candidate role and a matching profile.
        after: async (createdUser) => {
          await db.insert(candidateProfile).values({ userId: createdUser.id }).onConflictDoNothing();
        },
      },
    },
    session: {
      create: {
        // Suspended accounts can't start a session (admin suspension also ends existing ones)
        before: async (newSession) => {
          const [owner] = await db.select({ banned: user.banned }).from(user).where(eq(user.id, newSession.userId)).limit(1);
          if (owner?.banned) throw new APIError("FORBIDDEN", { message: "This account has been suspended. Contact ADDOZ support for help.", code: "ACCOUNT_SUSPENDED" });
        },
      },
    },
  },
});
