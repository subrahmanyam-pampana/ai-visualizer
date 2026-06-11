import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function PageWrapper({ children, className = '' }: Props) {
  return (
    <div className={`max-w-7xl mx-auto px-6 py-8 ${className}`}>
      {children}
    </div>
  )
}
