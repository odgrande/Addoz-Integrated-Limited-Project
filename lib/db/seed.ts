import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { areas } from '../../features/locations/data';
import { categories as publicCategories, getCategoryByName } from '../../features/categories/data';
import { companies as publicCompanies, getCompany } from '../../features/companies/data';
import { jobs as publicJobs } from '../../features/jobs/data';

config({ path: '.env.local' });

async function main() {
  const { db } = await import('./index');
  const schema = await import('./schema');
  console.log('Seeding database...');

  // Seed Locations
  const locations = [
    { id: 'loc_1', slug: 'victoria-island', name: 'Victoria Island' },
    { id: 'loc_2', slug: 'ikeja', name: 'Ikeja' },
    { id: 'loc_3', slug: 'ikorodu', name: 'Ikorodu' },
    { id: 'loc_4', slug: 'lekki', name: 'Lekki' },
  ];
  await db.insert(schema.location).values(locations).onConflictDoNothing();

  // Seed Categories
  const categories = [
    { id: 'cat_1', slug: 'design-creative', name: 'Design & Creative' },
    { id: 'cat_2', slug: 'development-it', name: 'Development & IT' },
    { id: 'cat_3', slug: 'marketing-sales', name: 'Marketing & Sales' },
    { id: 'cat_4', slug: 'product-management', name: 'Product Management' },
  ];
  await db.insert(schema.category).values(categories).onConflictDoNothing();
  await db.insert(schema.location).values(areas.map(area => ({ id: `loc_${area.slug}`, slug: area.slug, name: area.name, active: true }))).onConflictDoNothing();
  await db.insert(schema.category).values(publicCategories.map(item => ({ id: `cat_${item.slug}`, slug: item.slug, name: item.name, active: true }))).onConflictDoNothing();

  // Seed Skills
  const skills = [
    { id: 'sk_1', name: 'React' },
    { id: 'sk_2', name: 'TypeScript' },
    { id: 'sk_3', name: 'Figma' },
    { id: 'sk_4', name: 'Product Strategy' },
  ];
  await db.insert(schema.skill).values(skills).onConflictDoNothing();

  // Seed Companies
  const companies = [
    { slug: 'sample-tech-employer', name: 'Sample Tech Employer', website: 'https://example.com' },
    { slug: 'sample-creative-studio', name: 'Sample Creative Studio', website: 'https://example.com' },
  ];
  await db.insert(schema.company).values(companies).onConflictDoNothing();
  for (const item of publicCompanies) {
    const area = areas.find(area => area.slug === item.location);
    const [locationRecord] = area ? await db.select({ id: schema.location.id }).from(schema.location).where(eq(schema.location.slug, area.slug)).limit(1) : [];
    await db.insert(schema.company).values({ slug: item.slug, name: item.name, description: item.overview, industry: item.industry, companySize: item.size, locationId: locationRecord?.id ?? null, active: true }).onConflictDoNothing();
    if (locationRecord) {
      await db.update(schema.company).set({ description: item.overview, industry: item.industry, companySize: item.size, locationId: locationRecord.id }).where(eq(schema.company.slug, item.slug));
    }
  }
  const [sampleTechEmployer] = await db.select().from(schema.company)
    .where(eq(schema.company.slug, 'sample-tech-employer')).limit(1);
  if (!sampleTechEmployer) throw new Error('Sample Tech Employer was not created.');

  // Seed Users & Profiles
  await db.insert(schema.user).values({
    id: 'usr_candidate',
    name: 'Adaeze O.',
    email: 'candidate@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'candidate'
  }).onConflictDoNothing();

  await db.insert(schema.user).values({
    id: 'usr_employer',
    name: 'Hiring Manager',
    email: 'hiring@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'employer'
  }).onConflictDoNothing();

  const [candidateUser] = await db.select().from(schema.user)
    .where(eq(schema.user.email, 'candidate@example.com')).limit(1);
  const [employerUser] = await db.select().from(schema.user)
    .where(eq(schema.user.email, 'hiring@example.com')).limit(1);
  if (!candidateUser || !employerUser) throw new Error('Sample users were not created.');

  await db.insert(schema.candidateProfile).values({
    userId: candidateUser.id,
    headline: 'React developer, design systems',
    experience: '4 years',
    locationId: locations[1].id
  }).onConflictDoNothing({ target: schema.candidateProfile.userId });

  await db.insert(schema.employerProfile).values({
    userId: employerUser.id,
    companyId: sampleTechEmployer.id,
    contactName: 'Hiring Manager'
  }).onConflictDoNothing({ target: schema.employerProfile.userId });

  const [candidate] = await db.select().from(schema.candidateProfile)
    .where(eq(schema.candidateProfile.userId, candidateUser.id)).limit(1);
  if (!candidate) throw new Error('Sample candidate profile was not created.');

  // Seed Jobs
  await db.insert(schema.job).values({
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    companyId: sampleTechEmployer.id,
    categoryId: categories[1].id,
    locationId: locations[1].id,
    type: 'Full-time',
    workplace: 'Remote',
    level: 'Middle',
    experience: '3-5 years',
    salaryMin: 400000,
    salaryMax: 700000,
    salaryPeriod: 'month',
    featured: true,
    color: 'blue',
    summary: 'Build accessible, fast interfaces and collaborate with designers.',
    skills: ['React', 'TypeScript', 'Accessibility', 'Performance'],
    responsibilities: ['Build and maintain React interfaces'],
    requirements: ['Solid React and TypeScript experience']
  }).onConflictDoNothing();

  const [job] = await db.select().from(schema.job)
    .where(eq(schema.job.slug, 'frontend-developer')).limit(1);
  if (!job) throw new Error('Sample job was not created.');

  await db.insert(schema.jobApplication).values({
    jobId: job.id,
    candidateId: candidate.id,
    stage: 'Applied',
  }).onConflictDoNothing();

  // Move the public preview catalog into PostgreSQL so discovery and detail use
  // one publication source while keeping the existing sample labels in content.
  for (const item of publicJobs) {
    const publicCompany = getCompany(item.company);
    const publicCategory = getCategoryByName(item.category);
    const area = areas.find(area => area.slug === item.location);
    if (!publicCompany || !publicCategory || !area) continue;
    const [companyRecord] = await db.select({ id: schema.company.id }).from(schema.company).where(eq(schema.company.slug, publicCompany.slug)).limit(1);
    const [categoryRecord] = await db.select({ id: schema.category.id }).from(schema.category).where(eq(schema.category.slug, publicCategory.slug)).limit(1);
    const [locationRecord] = await db.select({ id: schema.location.id }).from(schema.location).where(eq(schema.location.slug, area.slug)).limit(1);
    if (!companyRecord || !categoryRecord || !locationRecord) continue;
    await db.insert(schema.job).values({
      slug: item.slug,
      title: item.title,
      companyId: companyRecord.id,
      categoryId: categoryRecord.id,
      locationId: locationRecord.id,
      type: item.type,
      workplace: item.workplace,
      level: item.level,
      experience: item.experience,
      salaryMin: item.salary?.min ?? null,
      salaryMax: item.salary?.max ?? null,
      salaryPeriod: item.salary?.period ?? 'month',
      postedAt: new Date(`${item.postedAt}T00:00:00Z`),
      deadline: new Date(`${item.deadline}T00:00:00Z`),
      featured: item.featured,
      apply: item.apply,
      mark: item.mark,
      color: item.color,
      summary: item.summary,
      responsibilities: item.responsibilities,
      requirements: item.requirements,
      skills: item.skills,
      status: 'Active',
    }).onConflictDoNothing();
  }

  console.log('Seeding complete!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
