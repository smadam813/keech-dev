import { publishedPosts } from '@/lib/posts'

export function GET() {
  const sortedPosts = [...publishedPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>keech.dev</title>
    <link>https://keech.dev</link>
    <description>Blog posts by Adam Keech</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(sortedPosts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="https://keech.dev/feed.xml" rel="self" type="application/rss+xml"/>
    ${sortedPosts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://keech.dev/blog/${post.slug}</link>
      <guid isPermaLink="true">https://keech.dev/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description || ''}]]></description>
    </item>`).join('')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
