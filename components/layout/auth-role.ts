export type AuthRole = "candidate" | "employer" | "admin"

/** Turn a `?role=` search param into an AuthRole (candidate by default). Safe on server and client. */
export function parseAuthRole(value: string | string[] | undefined): AuthRole {
  if (Array.isArray(value)) return value.includes("admin") ? "admin" : value.includes("employer") ? "employer" : "candidate"
  if (value === "employer" || value === "admin") return value
  return "candidate"
}

/** Carry the role through auth links; candidate links stay clean. */
export function roleHref(path: string, role: AuthRole) {
  if (role === "candidate") return path
  return `${path}${path.includes("?") ? "&" : "?"}role=${encodeURIComponent(role)}`
}
