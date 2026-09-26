/**
 * Locations. The six featured areas are the ADDOZ homepage's "Popular cities"
 * (Victoria Island, Ikorodu, Oshodi-Isolo, Badagry, Ikeja, Agege — live slugs under
 * /jobs-location/). The other areas appear on current ADDOZ job listings.
 *
 * Shape: country → state → area. It mirrors the table a production location
 * database will need (states, then LGAs/areas), so more of Nigeria can be added
 * without changing any page.
 */

export type State = { slug: string; name: string; country: "Nigeria" }
export type Area = { slug: string; name: string; state: string; featured: boolean }

export const states: State[] = [
  { slug: "lagos", name: "Lagos", country: "Nigeria" },
  { slug: "ogun", name: "Ogun", country: "Nigeria" },
]

export const areas: Area[] = [
  { slug: "victoria-island", name: "Victoria Island", state: "lagos", featured: true },
  { slug: "ikorodu", name: "Ikorodu", state: "lagos", featured: true },
  { slug: "oshodi-isolo", name: "Oshodi-Isolo", state: "lagos", featured: true },
  { slug: "badagry", name: "Badagry", state: "lagos", featured: true },
  { slug: "ikeja", name: "Ikeja", state: "lagos", featured: true },
  { slug: "agege", name: "Agege", state: "lagos", featured: true },
  { slug: "lekki", name: "Lekki", state: "lagos", featured: false },
  { slug: "ajah", name: "Ajah", state: "lagos", featured: false },
  { slug: "apapa", name: "Apapa", state: "lagos", featured: false },
  { slug: "mowe", name: "Mowe", state: "ogun", featured: false },
  { slug: "ibafo", name: "Ibafo", state: "ogun", featured: false },
  { slug: "ogijo", name: "Ogijo", state: "ogun", featured: false },
]

export const featuredAreas = areas.filter(area => area.featured)

export function getArea(slug: string) {
  return areas.find(area => area.slug === slug)
}

export function getAreaByName(name: string) {
  return areas.find(area => area.name === name)
}

export function getState(slug: string) {
  return states.find(state => state.slug === slug)
}

export function areasInState(state: string) {
  return areas.filter(area => area.state === state)
}

export function nearbyAreas(slug: string, limit = 5) {
  const area = getArea(slug)
  return area ? areas.filter(other => other.state === area.state && other.slug !== slug).slice(0, limit) : []
}
