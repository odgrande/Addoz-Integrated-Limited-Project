import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { candidateProfile } from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
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
  },
});
