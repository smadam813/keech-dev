# Writing Guide for keech.dev Blog Posts

Distilled principles for writing technical blog posts that are clear, useful, and worth reading. Apply these throughout the writing process.

## 1. Specificity Over Abstraction

Target real knowledge gaps. The best topics come from asking "what did I struggle with?" rather than "what do I know about?" Write about the specific thing that confused you, not the broad topic that contains it.

Every claim should have evidence. If you say something is faster, show the benchmark. If you say a pattern is better, show what it replaced and why.

**Test:** Can a reader take a concrete action after reading any given paragraph? If not, make it more specific.

## 2. Personal Voice First

This blog is written in Adam's voice. Every post should read like Adam sharing what he has learned, not like a research report summarizing what others found.

**Lead with personal experience, not external sources.** Open with your own take, your team's situation, or a problem you encountered firsthand. External references (reports, expert quotes, case studies) are supporting evidence woven into your narrative, never the headline.

Wrong: "The 2024 DORA Report found that AI tools decreased throughput by 1.5%."
Right: "My team has been experimenting with AI coding tools for six months, and the productivity gains have been uneven. The DORA Report's finding of a 1.5% throughput drop tracks with what I have seen firsthand."

Wrong: "Chris Lema argues that context should live in the file system."
Right: "I have been burned by context loss between agent sessions enough times to appreciate what Chris Lema means when he says intelligence should live in the file system, not memory."

The pattern: personal context first, then the external source as corroboration or contrast. Readers came to keech.dev for Adam's perspective. The research supports the perspective; it does not replace it.

**Test:** Does the opening paragraph contain a first-person sentence before any external citation? If not, restructure it.

## 3. Frontload Value

State what the post delivers in the opening sentences. The first paragraph is the make-or-break moment. Most readers skim the first sentence and decide whether to continue.

No throat-clearing. No "In this post, I will..." No historical preamble before the substance. Start with the insight, the technique, or the result.

**Test:** If a reader stops after the first paragraph, do they know exactly what this post offers?

## 4. Concrete Examples

Use more examples than feels natural. Real-world examples dramatically reduce misinterpretation. Readers who disagree with your prose will often agree with your examples.

Start from real code and simplify. Never invent artificial scenarios from scratch. Use realistic variable names, realistic data shapes, realistic error cases. Complete working code when possible.

**Anti-pattern:** `foo`, `bar`, `baz`, `myFunction`, `doStuff`. These teach nothing about the real usage context.

## 5. Conversational Tone

Write using ordinary words and simple sentences. The less energy readers spend parsing your prose, the more they have for your ideas.

Cut caveats unless they add genuine value. Write "companies reward pragmatic engineers" not "in my experience, I have seen that companies tend to reward pragmatic engineers, though every company operates differently."

Write for one specific person, a friend or coworker who is smart but unfamiliar with this particular topic. If it works for them, it works for most readers.

## 6. Structure for Scanning

Short paragraphs (2-4 sentences). **Bold key phrases** so skimmers catch the important bits. Clear section headings that tell readers what they will get, not clever headings that obscure the content.

Progressive disclosure: basics first, depth later. Let readers who need the simple version stop early. Let readers who need the deep version keep scrolling.

Use code blocks, bullet lists, and bold text to break up walls of prose. Dense paragraphs signal "this will be hard to read" even when the content is not complex.

## 7. Build Trust

Acknowledge what you do not know. No project is perfect. Ignoring the downsides risks seeming like you do not understand them. Discuss tradeoffs and limitations honestly.

Provide context about why you are writing this. A sentence like "I spent two days debugging this and could not find a clear explanation anywhere" builds more trust than positioning yourself as an authority.

Readers trust writers who show their reasoning, not just their conclusions.

## 8. Dual-Audience Writing

Use the inverted pyramid: broadest value first, detail deepening as the reader scrolls. Each section should be valuable on its own. A reader can stop at any point and walk away informed.

Do not write at a "medium" level that satisfies no one. Instead, design the structure so readers self-select their depth. Put the practical takeaway up front. Put the implementation details and edge cases later.

## 9. Title Craft

Be specific. "How I Cut Our Docker Build Time from 20 Minutes to 2" outperforms "Optimizing Docker Builds." Personal framing ("I built...", "How I...") signals a real person with real experience.

Create genuine curiosity gaps without clickbait. The title should make the reader think "I want to know how they did that" not "I wonder what this is about."

Aim for titles under 70 characters for good display across platforms.

## 10. Common Anti-Patterns to Avoid

These failure modes (drawn from Julia Evans' analysis) consistently produce confusing writing:

- **Inconsistent reader knowledge:** Explaining what a for loop is in one paragraph, then assuming knowledge of malloc in the next. Pick a level and stay there.
- **Starting abstract:** Leading with formal definitions instead of concrete examples. Open with a specific, realistic scenario and work backward to the abstraction.
- **Strained analogies:** Extended metaphors that force readers to decode the mapping. Keep analogies brief. A single idea, not an elaborate system.
- **What without why:** Describing what a tool does without explaining why anyone would use it. Always lead with the problem before the solution.
- **Unrealistic examples:** Code samples that no one would write in a real project. Start from real code and simplify.
- **Leading with external sources:** Opening a section or the entire post with what a report said, what an expert claimed, or what a study found. The reader should encounter Adam's experience or take before encountering any external reference.
- **Unsourced name-drops:** Mentioning a person, report, or organization by name without linking to the source. Every named reference needs an inline link. See the citation guidance in writer-instructions.md.
