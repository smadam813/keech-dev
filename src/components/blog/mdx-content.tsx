'use client'

import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

interface MDXContentProps {
  code: string
  components?: MDXComponents
}

const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

export function MDXContent({ code, components = {} }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
