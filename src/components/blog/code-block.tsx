'use client'

import { useRef, useCallback, type ComponentPropsWithoutRef } from 'react'
import { CopyButton } from './copy-button'

type PreProps = ComponentPropsWithoutRef<'pre'>

export function CodeBlock({ children, ...props }: PreProps) {
  const preRef = useRef<HTMLPreElement>(null)

  const getCodeText = useCallback(() => {
    if (preRef.current) {
      const code = preRef.current.querySelector('code')
      return code?.textContent || ''
    }
    return ''
  }, [])

  return (
    <div className="group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <CopyButton getText={getCodeText} />
    </div>
  )
}
