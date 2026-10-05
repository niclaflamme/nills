import { expect, test } from "@playwright/test";

test("search includes reference contents and supports keyboard access", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("textbox", { name: "Search skills" }),
  ).toBeFocused();
  await page.getByRole("textbox", { name: "Search skills" }).fill("checkpoint");
  await expect(
    page.getByRole("heading", {
      name: "Simplified Technical English",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Boring Python", exact: true }),
  ).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Boring Python", exact: true }),
  ).toBeVisible();
});

test("bookmarks survive reload and can be removed", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Bookmark Boring Python", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove bookmark for Boring Python" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".filter-tabs")
    .getByRole("button", { name: /Bookmarked/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Boring Python", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove bookmark for Boring Python" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Save a skill for later." }),
  ).toBeVisible();
});

test("opens guides, follows reference links, and supports source view and browser back", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /Boring Python.*Explore skill/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Boring Python", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".prose")
      .getByRole("link", { name: "the whitespace example" }),
  ).toHaveAttribute(
    "href",
    /#skill=boring-python&file=references%2Freadability-examples.md/,
  );
  await page
    .locator(".prose")
    .getByRole("link", { name: "the whitespace example" })
    .click();
  await expect(page).toHaveURL(/file=references%2Freadability-examples.md/);
  await expect(
    page
      .locator(".prose")
      .getByRole("heading", { name: "Whitespace as paragraphs" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Source", exact: true }).click();
  await expect(page.locator(".source-code")).toContainText(
    "Whitespace as paragraphs",
  );
  await page.goBack();
  await expect(page.locator(".document-toolbar")).toContainText("SKILL.md");
  await expect(page.locator(".prose")).toBeVisible();
});

test("direct URLs, file tabs, and missing-file states work", async ({
  page,
}) => {
  await page.goto("/#skill=asd-ste100&file=agents%2Fopenai.yaml");
  await expect(page.locator(".source-code")).toContainText("default_prompt:");
  await page.getByRole("link", { name: /Skill guide/ }).click();
  await expect(
    page
      .locator(".prose")
      .getByRole("heading", { name: "Preserve the contract" }),
  ).toBeVisible();
  await page.goto("/#skill=asd-ste100&file=missing.md");
  await expect(
    page.getByRole("heading", { name: "File not found" }),
  ).toBeVisible();
  await page.goto("/#skill=removed");
  await expect(
    page.getByRole("heading", { name: "That skill isn’t in the library." }),
  ).toBeVisible();
});

test("switches layouts and themes without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(page.locator(".skill-grid")).toHaveClass(/list-view/);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/#skill=boring-python");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("sanitizes executable HTML in rendered Markdown", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/web/markdown.ts";
    const { renderMarkdown } = await import(modulePath);
    const { html } = renderMarkdown(
      '<script>alert(1)</script>\n\n<a href="javascript:alert(2)" onclick="alert(3)">bad</a>\n\n<img src="x" onerror="alert(4)">',
    );
    const holder = document.createElement("div");
    holder.innerHTML = html;
    return {
      scripts: holder.querySelectorAll("script").length,
      handlers: holder.querySelectorAll("[onclick], [onerror]").length,
      unsafeLinks: holder.querySelectorAll('[href^="javascript:"]').length,
    };
  });
  expect(result).toEqual({ scripts: 0, handlers: 0, unsafeLinks: 0 });
});
