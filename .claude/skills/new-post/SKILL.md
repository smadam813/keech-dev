---
name: new-post
description: Scaffold a new blog post at content/posts/<slug>.mdx with frontmatter that passes the Velite schema. Use when the user wants to start a new post. Takes the post title as an argument.
disable-model-invocation: true
---

Create a new post from the title in `$ARGUMENTS`. If no title was given, ask for one.

Steps:

1. Derive the slug: lowercase, ASCII, words joined with `-`, no leading/trailing dashes. Check `content/posts/` and pick a different slug if that file already exists.
2. Read `velite.config.ts` and use the `posts` schema as the source of truth. As of writing it requires `title` (max 99 chars), `slug`, and `date` (ISO `YYYY-MM-DD`), with optional `updated`, `description` (max 300 chars), `tags` (array, default `[]`), and `draft` (default `false`).
3. Look at the tags already used across `content/posts/*.mdx` and reuse existing ones where they fit rather than inventing near-duplicates.
4. Write `content/posts/<slug>.mdx` with this shape:

```mdx
---
title: "<title>"
slug: <slug>
date: <today, YYYY-MM-DD>
description: "<one or two sentences, under 300 chars>"
tags:
  - <tag>
draft: true
---

<opening paragraph>
```

   Set `draft: true` so it does not publish on the next Vercel build. Write only a short opening paragraph unless the user asked for a full draft.

5. Run `npm run velite` and confirm the new post appears in `.velite/posts.json` with no schema errors. If Velite reports a validation error, fix the frontmatter and rerun.
6. Report the file path and the slug's permalink (`/blog/<slug>`), and remind the user to flip `draft: false` when ready.

Images go in `public/images/posts/` and are referenced as `/images/posts/<file>` inside the post.
