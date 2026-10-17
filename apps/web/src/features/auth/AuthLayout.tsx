import type { ReactNode } from 'react'

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold text-muted-foreground">TraiNote</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  )
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </label>
  )
}

export const inputClass = 'h-12 text-base md:text-base'
