import type { ReactNode } from 'react'

/** Narrow centered column shared by admin login and setup. */
export function AdminAuthPage({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <p className="text-sm font-semibold text-muted">Bazar · Panel admin</p>
      <h1 className="pb-2 pt-1 text-3xl text-balance">{title}</h1>
      {intro && <div className="pb-6 text-sm text-muted">{intro}</div>}
      {children}
    </main>
  )
}
