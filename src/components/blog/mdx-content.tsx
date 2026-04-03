'use client'

import React from 'react'
import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from './code-block'

interface MDXContentProps {
  code: string
  components?: MDXComponents
}

const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

const defaultComponents: MDXComponents = {
  pre: CodeBlock,
  ul: (props: React.ComponentPropsWithoutRef<'ul'>) => <ul role="list" {...props} />,
  ol: (props: React.ComponentPropsWithoutRef<'ol'>) => <ol role="list" {...props} />,
}

function MDXFallback() {
  return (
    <div className="border-[3px] border-foreground bg-surface p-8 shadow-brutal text-center my-8">
      <h2 className="font-display text-2xl mb-4">This post couldn&apos;t be displayed</h2>
      <p className="text-muted mb-6">Something went wrong while rendering this content.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
      <a
        href="/blog"
        className="inline-block border-[3px] border-foreground bg-accent text-white px-6 py-2 font-semibold shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        Back to Blog
      </a>
    </div>
  )
}

export function MDXContent({ code, components = {} }: MDXContentProps) {
  try {
    const Component = useMDXComponent(code)
    return <Component components={{ ...defaultComponents, ...components }} />
  } catch (error) {
    console.error('[mdx] Failed to render content:', error)
    return <MDXFallback />
  }
}
