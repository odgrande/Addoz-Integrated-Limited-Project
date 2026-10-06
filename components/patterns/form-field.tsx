"use client"

import { Children, cloneElement, isValidElement, useId, useRef, useState, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react"
import { ChevronDown, CircleAlert, UploadCloud, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * FormField wires label, hint and error to its single control (id,
 * aria-describedby, aria-invalid) so every form in ADDOZ is accessible by default.
 */
export function FormField({ label, hint, error, required, optional, children, className, id: givenId }: {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  required?: boolean
  optional?: boolean
  children: ReactElement
  className?: string
  id?: string
}) {
  const autoId = useId()
  const id = givenId ?? `field-${autoId}`
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined
  const control = Children.only(children)
  return <div className={cn("field", error && "is-invalid", className)}>
    <label className="field-label" htmlFor={id}>
      {label}
      {required && <span className="field-required" aria-hidden="true">*</span>}
      {optional && <span className="field-optional">Optional</span>}
    </label>
    {isValidElement(control) ? cloneElement(control as ReactElement<Record<string, unknown>>, { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required }) : control}
    {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${id}-error`} role="alert"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
  </div>
}

export function FieldRow({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  return <div className={cn("field-row", `field-row-${columns}`)}>{children}</div>
}

export function Input({ icon, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  if (!icon) return <input className={cn("field-input", className)} {...props} />
  return <span className="field-input-wrap"><span className="field-input-icon" aria-hidden="true">{icon}</span><input className={cn("field-input", "has-icon", className)} {...props} /></span>
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="field-select-wrap"><select className={cn("field-input", "field-select", className)} {...props}>{children}</select><ChevronDown className="field-select-chevron" size={16} aria-hidden="true" /></span>
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field-input", "field-textarea", className)} {...props} />
}

export function Checkbox({ label, description, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return <label className={cn("check", className)}>
    <input type="checkbox" {...props} />
    <span className="check-box" aria-hidden="true" />
    <span className="check-text">{label}{description && <small>{description}</small>}</span>
  </label>
}

export function Radio({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return <label className={cn("check", "check-radio", className)}>
    <input type="radio" {...props} />
    <span className="check-box" aria-hidden="true" />
    <span className="check-text">{label}</span>
  </label>
}

export function Switch({ checked, onChange, label, description, id }: { checked: boolean; onChange: (next: boolean) => void; label: ReactNode; description?: ReactNode; id?: string }) {
  const autoId = useId()
  const labelId = `${id ?? autoId}-label`
  return <div className="switch-row">
    <span className="switch-text"><span id={labelId}>{label}</span>{description && <small>{description}</small>}</span>
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={labelId} id={id} className="switch" onClick={() => onChange(!checked)}><span className="switch-thumb" /></button>
  </div>
}

/** Large radio cards — e.g. Candidate / Employer at registration. */
export function ChoiceCards<T extends string>({ name, value, onChange, options, legend }: {
  name: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; description?: string; icon?: ReactNode }[]
  legend: string
}) {
  return <fieldset className="choice-cards">
    <legend className="field-label">{legend}</legend>
    <div className="choice-grid">
      {options.map(option => <label key={option.value} className={cn("choice-card", value === option.value && "is-selected")}>
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        {option.icon && <span className="choice-icon" aria-hidden="true">{option.icon}</span>}
        <span className="choice-label">{option.label}</span>
        {option.description && <span className="choice-description">{option.description}</span>}
      </label>)}
    </div>
  </fieldset>
}

/**
 * File drop zone. UI only: the chosen file stays in the browser (no upload until
 * production file storage exists — Directive 007 §24).
 */
export function FileDrop({ accept, label = "Drop a file here, or browse", hint, onFile, id }: { accept?: string; label?: string; hint?: string; onFile?: (file: File | null) => void; id?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [over, setOver] = useState(false)
  const choose = (next: File | null) => { setFile(next); onFile?.(next) }
  return <div className={cn("file-drop", over && "is-over", file && "has-file")}
    onDragOver={event => { event.preventDefault(); setOver(true) }}
    onDragLeave={() => setOver(false)}
    onDrop={event => { event.preventDefault(); setOver(false); choose(event.dataTransfer.files?.[0] ?? null) }}>
    <input ref={input} id={id} type="file" accept={accept} className="sr-only" onChange={event => choose(event.target.files?.[0] ?? null)} />
    {file ? <div className="file-chosen">
      <UploadCloud size={22} aria-hidden="true" />
      <span><strong>{file.name}</strong><small>{Math.max(1, Math.round(file.size / 1024))} KB · ready to upload</small></span>
      <button type="button" className="file-clear" onClick={() => { choose(null); if (input.current) input.current.value = "" }} aria-label="Remove file"><X size={16} /></button>
    </div> : <button type="button" className="file-drop-button" onClick={() => input.current?.click()}>
      <UploadCloud size={26} aria-hidden="true" />
      <strong>{label}</strong>
      {hint && <small>{hint}</small>}
    </button>}
  </div>
}
