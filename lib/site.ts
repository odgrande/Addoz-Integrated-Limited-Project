/**
 * ADDOZ business facts — the single source for company details on every page.
 * Every value here is taken from the current site (addozconsultinglimited.com,
 * checked 23 Sep 2026). Template leftovers on that site (theme demo team, demo
 * pricing, the uxper.co privacy link, "1K+ jobs" counters) are deliberately
 * NOT carried over — see ADDOZ-PAGE-MAP.md › Source content.
 */
export const site = {
  name: "ADDOZ",
  legalName: "ADDOZ Integrated Resources Limited",
  liveSite: "https://addozconsultinglimited.com",
  // About page
  headline: "We are transforming the way Nigeria finds and hires talent",
  mission: "Our mission is to connect job seekers with the right opportunities while helping employers find the right talent, faster and easier.",
  // Footer description (live copy reads "We connects"; grammar corrected, meaning unchanged)
  description: "We connect job seekers with opportunities, helping employers find qualified talent while making hiring and career discovery simpler, faster, and more accessible.",
  closing: "Find your next opportunity or connect with the right talent, one opportunity at a time.",
  // Contact page
  email: "addozng@gmail.com",
  phones: [
    { display: "+234 806 618 8771", href: "tel:+2348066188771" },
    { display: "0802 109 9314", href: "tel:+2348021099314" },
    { display: "0803 227 0655", href: "tel:+2348032270655" },
  ],
  office: {
    label: "Head office",
    // Live copy: "Rotimi Idowu Plaza, Suite C4, 545 Lagos Aboekuta Express Way, Abule Egba, Lagos."
    lines: ["Rotimi Idowu Plaza, Suite C4", "545 Lagos–Abeokuta Expressway", "Abule Egba, Lagos"],
    mapQuery: "Rotimi Idowu Plaza, 545 Lagos-Abeokuta Expressway, Abule Egba, Lagos",
  },
  socials: [
    { label: "X (Twitter)", handle: "@Addozresources", href: "https://x.com/Addozresources" },
    { label: "Facebook", handle: "ADDOZ on Facebook", href: "https://web.facebook.com/profile.php?id=61582469351491" },
    { label: "Instagram", handle: "@addozresourceslimited", href: "https://www.instagram.com/addozresourceslimited/" },
  ],
  newsletter: { title: "Subscribe to our newsletter", body: "We'll keep you updated with the best new jobs." },
} as const

export type Site = typeof site
