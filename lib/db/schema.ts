import { sql } from "drizzle-orm";
import { pgTable, pgEnum, text, integer, timestamp, boolean, uuid, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";

export const userRole = pgEnum('user_role', ['candidate', 'employer', 'admin']);

// --- BETTER AUTH REQUIRED TABLES ---
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').notNull(),
	image: text('image'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
    role: userRole('role').notNull().default('candidate'),
    banned: boolean('banned'),
    banReason: text('banReason'),
    banExpires: timestamp('banExpires')
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expiresAt').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId').notNull().references(()=> user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId').notNull().references(()=> user.id),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt').notNull(),
	createdAt: timestamp('createdAt'),
	updatedAt: timestamp('updatedAt')
});


// --- ADDOZ DOMAIN TABLES ---

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
}, (table) => [index("category_active_idx").on(table.active)]);

export const location = pgTable("location", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
}, (table) => [index("location_active_idx").on(table.active)]);

export const skill = pgTable("skill", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const company = pgTable("company", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  logo: text("logo"),
  website: text("website"),
  description: text("description"),
  industry: text("industry"),
  locationId: text("location_id").references(() => location.id),
  companySize: text("company_size"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [index("company_active_idx").on(table.active)]);

export const candidateProfile = pgTable("candidate_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id).unique().notNull(),
  headline: text("headline"),
  experience: text("experience"),
  locationId: text("location_id").references(() => location.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employerProfile = pgTable("employer_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id).unique().notNull(),
  companyId: uuid("company_id").references(() => company.id),
  contactName: text("contact_name"),
  jobTitle: text("job_title"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const job = pgTable("job", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  companyId: uuid("company_id").references(() => company.id).notNull(),
  categoryId: text("category_id").references(() => category.id).notNull(),
  locationId: text("location_id").references(() => location.id).notNull(),
  type: text("type").notNull(), // Full-time, etc.
  workplace: text("workplace").notNull(), // On-site, Hybrid, Remote
  level: text("level").notNull(),
  experience: text("experience").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryPeriod: text("salary_period"), // month, year
  postedAt: timestamp("posted_at").defaultNow().notNull(),
  deadline: timestamp("deadline"),
  featured: boolean("featured").default(false),
  apply: text("apply").default('addoz'),
  mark: text("mark"),
  color: text("color"),
  summary: text("summary"),
  responsibilities: text("responsibilities").array(),
  requirements: text("requirements").array(),
  skills: text("skills").array(),
  status: text("status").default('Active'), // Draft, Pending (awaiting admin review), Active, Paused, Closed, Declined, Archived
  approvedAt: timestamp("approved_at"), // set when an admin approves; approved jobs can be re-published without review
  moderationNote: text("moderation_note"), // reason shown to the employer when a job is declined
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("job_status_idx").on(table.status),
  index("job_category_idx").on(table.categoryId),
  index("job_location_idx").on(table.locationId),
  index("job_created_at_idx").on(table.createdAt),
]);

export const resume = pgTable("resume", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").references(() => candidateProfile.id).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size"),
  url: text("url").notNull(),
  storageKey: text("storage_key"),
  mimeType: text("mime_type"),
  status: text("status").default('active'),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  lastScan: timestamp("last_scan"),
});

export const jobApplication = pgTable("job_application", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => job.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidateProfile.id),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  stage: text("stage").default('Applied'), // Applied, In review, Shortlisted, Interview, Offer, Hired, Not selected
  resumeId: uuid("resume_id").references(() => resume.id),
  coverLetter: text("cover_letter"),
  applicationReference: text("application_reference"),
  candidateSnapshot: text("candidate_snapshot"),
  screeningAnswers: text("screening_answers"),
  cvFileName: text("cv_file_name"),
  cvStorageKey: text("cv_storage_key"),
  cvUrl: text("cv_url"),
  cvMimeType: text("cv_mime_type"),
  cvFileSize: text("cv_file_size"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("job_application_candidate_job_unique").on(table.candidateId, table.jobId),
  uniqueIndex("job_application_reference_unique").on(table.applicationReference),
  // One guest application per email per job (registered candidates are covered above)
  uniqueIndex("job_application_guest_job_unique").on(table.jobId, sql`lower(${table.guestEmail})`).where(sql`${table.candidateId} is null`),
  index("job_application_job_idx").on(table.jobId),
]);

export const savedJob = pgTable("saved_job", {
  candidateId: uuid("candidate_id").references(() => candidateProfile.id).notNull(),
  jobId: uuid("job_id").references(() => job.id).notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.candidateId, table.jobId] })
  ]
});

export const jobAlert = pgTable("job_alert", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").references(() => candidateProfile.id).notNull(),
  name: text("name").notNull(),
  keywords: text("keywords"),
  categoryId: text("category_id").references(() => category.id),
  locationId: text("location_id").references(() => location.id),
  workplace: text("workplace"),
  frequency: text("frequency").default('Daily'),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notification = pgTable("notification", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id).notNull(),
  kind: text("kind"), // application, alert, tip, account
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false),
  href: text("href"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: text("actor_user_id").references(() => user.id).notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  source: text("source"), // footer, blog
  createdAt: timestamp("created_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
}, (table) => [uniqueIndex("newsletter_subscriber_email_unique").on(table.email)]); // stored lowercased

export const contactMessage = pgTable("contact_message", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("contact_message_created_at_idx").on(table.createdAt)]);

// --- MESSAGING ---
// "application": the hiring company's employers ↔ the candidate who applied.
// "support": ADDOZ admins ↔ one candidate or employer (`userId`).
export const conversation = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(), // application, support
  applicationId: uuid("application_id").references(() => jobApplication.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  subject: text("subject").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("conversation_application_unique").on(table.applicationId),
  index("conversation_user_idx").on(table.userId),
  index("conversation_last_message_idx").on(table.lastMessageAt),
]);

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversation.id, { onDelete: "cascade" }).notNull(),
  senderUserId: text("sender_user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("message_conversation_created_idx").on(table.conversationId, table.createdAt)]);

export const conversationRead = pgTable("conversation_read", {
  conversationId: uuid("conversation_id").references(() => conversation.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.conversationId, table.userId] })]);

// Private file bytes (CVs) when no object store (R2) is configured.
// Stored base64-encoded; files are capped at 4 MB.
export const storedFile = pgTable("stored_file", {
  key: text("key").primaryKey(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
