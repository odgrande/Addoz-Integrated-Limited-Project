/**
 * Testimonials exactly as published on addozconsultinglimited.com ("What Our
 * Users Say"), checked 23 Sep 2026. Do not add or edit testimonials here without
 * a real source.
 */
export const testimonials = [
  { name: "Anna Aderoju", role: "Job Seeker", quote: "ADDOZ made my job search much easier. I found relevant vacancies, applied quickly, and finally landed a role that matched my skills, experience, and career goals." },
  { name: "Adeolu David", role: "Doctor", quote: "They helped me find a position where I can make a real difference. The process was simple, the opportunities were relevant, and I found a medical role that fits my experience and passion." },
  { name: "Grace Nwachukwu", role: "HR Specialist", quote: "ADDOZ helped me connect with strong candidates and simplify the hiring process. I found the right talent faster, reviewed qualified applicants, and made better hiring decisions with confidence." },
  { name: "Sarah Adebayo", role: "Fresh Graduate", quote: "ADDOZ gave me the opportunity to start my career with confidence. I found relevant graduate roles, applied easily, and got a position that gives me room to learn, grow, and build my future." },
] as const

// Employer proposition and process — current ADDOZ employer page (/employer/)
export const employerProposition = {
  heading: "Looking to post a job?",
  sub: "Find professionals from around the world and across all skills.",
  cta: "Post your job for FREE",
  benefits: [
    { title: "2 minutes to post", body: "Post jobs quickly and easily with our streamlined, optimized job posting form." },
    { title: "Attract audience", body: "Reach thousands of talented jobseekers across Nigeria." },
    { title: "30 days visibility", body: "Get quality applications with 30 days of job ad visibility." },
  ],
  steps: ["Create Your Company", "Post a Job", "Reach Candidates", "Review Applications", "Shortlist & Interview", "Hire the Right Talent"],
} as const

// Candidate process — current ADDOZ homepage ("Find a job using Addoz in 3 easy steps")
export const candidateProcess = {
  heading: "Explore a faster, easier, and better job search",
  body: "Find the right role faster with verified openings, clear job details, and a simple application process. For employers, post jobs, review applicants, and hire with less back and forth.",
  steps: [
    { title: "Search for jobs wherever you are", body: "Find relevant job opportunities across Nigeria and discover positions that match your skills, experience, and career goals." },
    { title: "Pick & Filter from a curated list of jobs", body: "Filter jobs by category, location, skills, job type, experience level, and other criteria to quickly find the right opportunities." },
    { title: "View the job details and apply easily", body: "Review the job requirements, company information, salary, and other details, then apply directly through ADDOZ." },
  ],
} as const
