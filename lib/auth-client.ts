import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

// No baseURL: the client talks to /api/auth on whatever origin the page was
// served from, so browser and server always agree on the session cookie.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), emailOTPClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
