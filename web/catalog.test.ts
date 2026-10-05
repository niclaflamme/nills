import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCatalog } from "./catalog";

const directories: string[] = [];

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "nills-catalog-"));
  directories.push(root);
  const skill = join(root, "sample");
  await mkdir(skill);
  await writeFile(
    join(skill, "SKILL.md"),
    "---\nname: sample\ndescription: A useful example.\nmetadata:\n  category: Research\n---\n# Sample guide\n\nRead the guide.\n",
  );
  return { root, skill };
}

afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

test("discovers skills, YAML metadata, and nested references from the source files", async () => {
  const { root, skill } = await fixture();
  await mkdir(join(skill, "agents"));
  await mkdir(join(skill, "references"));
  await writeFile(
    join(skill, "agents/openai.yaml"),
    "interface:\n  display_name: Display title\n  short_description: Short summary\n  default_prompt: Use $sample.\n",
  );
  await writeFile(
    join(skill, "references/example.md"),
    "# Example\n\nSome reference text.",
  );
  const catalog = await loadCatalog(root);
  expect(catalog.skills).toHaveLength(1);
  const entry = catalog.skills[0];
  expect(entry.title).toBe("Display title");
  expect(entry.category).toBe("Research");
  expect(entry.prompt).toBe("Use $sample.");
  expect(entry.files[0].path).toBe("SKILL.md");
  expect(entry.files[0].body).toBe("# Sample guide\n\nRead the guide.");
  expect(entry.files[0].content).toContain("name: sample");
  expect(
    entry.files.find((file) => file.path === "references/example.md")?.body,
  ).toContain("Some reference text.");
});

test("reflects added and edited files without a hand-maintained manifest", async () => {
  const { root, skill } = await fixture();
  expect((await loadCatalog(root)).skills[0].files).toHaveLength(1);
  await writeFile(join(skill, "notes.md"), "First version.");
  expect((await loadCatalog(root)).skills[0].files).toHaveLength(2);
  await writeFile(join(skill, "notes.md"), "Updated version.");
  expect(
    (await loadCatalog(root)).skills[0].files.find(
      (file) => file.path === "notes.md",
    )?.content,
  ).toBe("Updated version.");
});

test("does not publish hidden files or symlinked files outside the skill", async () => {
  const { root, skill } = await fixture();
  await writeFile(join(root, "secret.txt"), "not a skill resource");
  await writeFile(join(skill, ".private"), "hidden");
  await symlink(join(root, "secret.txt"), join(skill, "escape.txt"));
  await symlink(skill, join(root, "alias"));
  const catalog = await loadCatalog(root);
  expect(catalog.skills.map((skill) => skill.name)).toEqual(["sample"]);
  expect(catalog.skills[0].files.map((file) => file.path)).toEqual([
    "SKILL.md",
  ]);
});

test("keeps binary assets visible without treating them as text", async () => {
  const { root, skill } = await fixture();
  await writeFile(
    join(skill, "image.png"),
    new Uint8Array([137, 80, 78, 71, 0, 255]),
  );
  const file = (await loadCatalog(root)).skills[0].files.find(
    (file) => file.path === "image.png",
  );
  expect(file?.content).toBeNull();
});

test("rejects invalid skill identities and missing descriptions", async () => {
  const { root, skill } = await fixture();
  await writeFile(
    join(skill, "SKILL.md"),
    "---\nname: different-name\ndescription: Example\n---\n# Example",
  );
  await expect(loadCatalog(root)).rejects.toThrow("skill name must match");
  await writeFile(
    join(skill, "SKILL.md"),
    '---\nname: sample\ndescription: ""\n---\n# Example',
  );
  await expect(loadCatalog(root)).rejects.toThrow(
    "description must be nonempty",
  );
});

test("rejects missing or malformed frontmatter with a useful file location", async () => {
  const { root, skill } = await fixture();
  await writeFile(join(skill, "SKILL.md"), "# No metadata");
  await expect(loadCatalog(root)).rejects.toThrow(
    "sample/SKILL.md: expected YAML frontmatter",
  );
  await rm(join(skill, "SKILL.md"));
  await expect(loadCatalog(root)).rejects.toThrow(
    "sample: missing readable SKILL.md",
  );
});
