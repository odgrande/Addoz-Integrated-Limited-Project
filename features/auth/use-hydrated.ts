"use client"

import { useEffect, useState } from "react"

/** False until the page's script has loaded — auth forms keep their submit button disabled until then, so an early tap can't trigger a plain page reload. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
