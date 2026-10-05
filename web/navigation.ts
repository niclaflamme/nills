export interface Route {
  skill: string | null;
  file: string;
  section: string | null;
}

export function parseRoute(hash: string): Route {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    skill: params.get("skill"),
    file: params.get("file") || "SKILL.md",
    section: params.get("section"),
  };
}

export function routeHash(
  skill: string,
  file = "SKILL.md",
  section?: string,
): string {
  const params = new URLSearchParams({ skill });
  if (file !== "SKILL.md") params.set("file", file);
  if (section) params.set("section", section);
  return `#${params}`;
}

// Resolve Markdown links within a skill without allowing directory traversal.
export function resolveDocumentLink(
  currentFile: string,
  href: string,
): { file: string; section?: string } | null {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(href)) return null;
  const [rawPath, rawSection] = href.split("#", 2);
  let path: string;
  let section: string | undefined;
  try {
    path = decodeURIComponent(rawPath);
    section = rawSection ? decodeURIComponent(rawSection) : undefined;
  } catch {
    return null;
  }
  if (path.includes("\\") || path.startsWith("/") || path.includes("\0"))
    return null;
  if (!path) return { file: currentFile, section };
  const segments = currentFile.split("/").slice(0, -1);
  for (const segment of path.split("/")) {
    if (segment === "..") {
      if (!segments.length) return null;
      segments.pop();
    } else if (segment && segment !== ".") segments.push(segment);
  }
  return segments.length ? { file: segments.join("/"), section } : null;
}
