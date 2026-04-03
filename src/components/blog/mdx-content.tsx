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

export function MDXContent({ code, components = {} }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={{ ...defaultComponents, ...components }} />
}
