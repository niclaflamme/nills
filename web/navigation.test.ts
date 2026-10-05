import { expect, test } from "bun:test";
import { parseRoute, resolveDocumentLink, routeHash } from "./navigation";

test("round-trips shareable skill, file, and section locations", () => {
  const hash = routeHash("sample", "references/a file.md", "a-heading");
  expect(parseRoute(hash)).toEqual({
    skill: "sample",
    file: "references/a file.md",
    section: "a-heading",
  });
  expect(parseRoute("")).toEqual({
    skill: null,
    file: "SKILL.md",
    section: null,
  });
});

test("resolves references and same-file headings", () => {
  expect(
    resolveDocumentLink("SKILL.md", "references/example.md#details"),
  ).toEqual({ file: "references/example.md", section: "details" });
  expect(resolveDocumentLink("references/example.md", "../SKILL.md")).toEqual({
    file: "SKILL.md",
    section: undefined,
  });
  expect(resolveDocumentLink("references/example.md", "#details")).toEqual({
    file: "references/example.md",
    section: "details",
  });
});

test("does not route external links or paths escaping the skill", () => {
  for (const href of [
    "https://example.com",
    "mailto:a@example.com",
    "//example.com",
    "/etc/passwd",
    "../secret",
    "%2e%2e/secret",
    "%2Fetc/passwd",
    "..\\secret",
    "javascript:alert(1)",
    "%00",
    "%invalid",
  ]) {
    expect(resolveDocumentLink("SKILL.md", href)).toBeNull();
  }
});
