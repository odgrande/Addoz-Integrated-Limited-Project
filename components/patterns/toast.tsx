"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { CircleAlert, CircleCheck, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "success" | "info" | "error"
type ToastItem = { id: number; title: string; body?: string; tone: Tone }
type ToastFn = (toast: { title: string; body?: string; tone?: Tone }) => void

const ToastContext = createContext<ToastFn>(() => {})

/** App-wide toasts (polite live region). Mounted once in the root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const dismiss = useCallback((id: number) => setItems(list => list.filter(item => item.id !== id)), [])
  const toast = useCallback<ToastFn>(({ title, body, tone = "success" }) => {
    const id = nextId.current++
    setItems(list => [...list.slice(-2), { id, title, body, tone }])
  }, [])
  return <ToastContext.Provider value={toast}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
      {items.map(item => <Toast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />)}
    </div>
  </ToastContext.Provider>
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => { const timer = setTimeout(onDismiss, 4800); return () => clearTimeout(timer) }, [onDismiss])
  const Icon = item.tone === "error" ? CircleAlert : item.tone === "info" ? Info : CircleCheck
  return <div className={cn("toast", `toast-${item.tone}`)} role={item.tone === "error" ? "alert" : "status"}>
    <Icon size={20} aria-hidden="true" />
    <div><strong>{item.title}</strong>{item.body && <p>{item.body}</p>}</div>
    <button type="button" onClick={onDismiss} aria-label="Dismiss notification"><X size={16} /></button>
  </div>
}

export function useToast() {
  return useContext(ToastContext)
}
