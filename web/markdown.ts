import DOMPurify from "dompurify";
import { Marked } from "marked";

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderMarkdown(
  source: string,
  resolveHref: (href: string) => string | null = (href) => href,
) {
  const outline: { id: string; title: string; depth: number }[] = [];
  const seen = new Map<string, number>();
  const markdown = new Marked({
    gfm: true,
    renderer: {
      heading(token) {
        const title = token.text.replace(/<[^>]*>/g, "").replace(/[`*_]/g, "");
        const base =
          title
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .trim()
            .replace(/\s+/g, "-") || "section";
        const count = seen.get(base) || 0;
        seen.set(base, count + 1);
        const id = count ? `${base}-${count}` : base;
        if (token.depth === 2 || token.depth === 3)
          outline.push({ id, title, depth: token.depth });
        return `<h${token.depth} id="${escapeAttribute(id)}">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
      },
      link(token) {
        const href = resolveHref(token.href);
        const label = this.parser.parseInline(token.tokens);
        if (href === null) return label;
        const external = /^(https?:|mailto:)/i.test(href);
        return `<a href="${escapeAttribute(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
      },
    },
  });
  const html = DOMPurify.sanitize(markdown.parse(source, { async: false }), {
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["img"],
  });
  return { html, outline };
}
