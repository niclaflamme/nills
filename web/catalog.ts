import { readdir, readFile, realpath } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";
import { parse } from "yaml";
import type { Catalog, Skill, SkillFile } from "./types.ts";

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isPathWithinDirectory(
  directoryPath: string,
  candidatePath: string,
): boolean {
  const location = relative(directoryPath, candidatePath);
  return (
    location !== ".." &&
    !location.startsWith(`..${sep}`) &&
    !location.startsWith(sep)
  );
}

function parseSkillFrontmatter(skillSource: string, skillFilePath: string) {
  const match = skillSource.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${skillFilePath}: expected YAML frontmatter.`);
  return {
    data: record(parse(match[1])),
    body: skillSource.slice(match[0].length).trim(),
  };
}

async function readSkillFiles(
  directoryPath: string,
  skillDirectoryPath = directoryPath,
): Promise<SkillFile[]> {
  const files: SkillFile[] = [];
  const entries = await readdir(directoryPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    // Hidden files and symlinks are not part of the published catalog.
    if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readSkillFiles(entryPath, skillDirectoryPath)));
    } else if (entry.isFile()) {
      const fileBytes = await readFile(entryPath);
      let content: string | null = null;
      try {
        if (!fileBytes.includes(0))
          content = new TextDecoder("utf-8", { fatal: true }).decode(fileBytes);
      } catch {
        /* Binary assets stay visible, without a text preview. */
      }
      files.push({
        path: relative(skillDirectoryPath, entryPath).split(sep).join("/"),
        content,
        body: content,
      });
    }
  }
  return files;
}

function inferSkillCategory(name: string, description: string): string {
  const words = `${name} ${description}`.toLowerCase();
  if (/\b(python|code|programming|refactor|debug|testing)\b/.test(words))
    return "Engineering";
  if (/\b(english|writing|prose|documentation|rewrite)\b/.test(words))
    return "Writing";
  return "General";
}

export async function loadCatalog(skillsDirectory: string): Promise<Catalog> {
  const root = await realpath(skillsDirectory);
  const entries = await readdir(root, { withFileTypes: true });
  const skills: Skill[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (
      entry.name.startsWith(".") ||
      !entry.isDirectory() ||
      entry.isSymbolicLink()
    )
      continue;
    const directory = await realpath(join(root, entry.name));
    if (!isPathWithinDirectory(root, directory))
      throw new Error(`Skill directory escapes the collection: ${entry.name}`);
    const files = await readSkillFiles(directory);
    const guide = files.find((file) => file.path === "SKILL.md");
    if (!guide?.content)
      throw new Error(`${entry.name}: missing readable SKILL.md.`);
    const { data, body } = parseSkillFrontmatter(
      guide.content,
      `${entry.name}/SKILL.md`,
    );
    const name = text(data.name);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
      name !== basename(directory)
    ) {
      throw new Error(
        `${entry.name}: skill name must match its directory and use lowercase words separated by hyphens.`,
      );
    }
    const description = text(data.description);
    if (!description)
      throw new Error(`${entry.name}: description must be nonempty.`);
    guide.body = body;
    const agentFile = files.find((file) => file.path === "agents/openai.yaml");
    const ui = record(
      agentFile?.content ? record(parse(agentFile.content)).interface : {},
    );
    const metadata = record(data.metadata);
    const heading = body.match(/^#\s+(.+)$/m)?.[1];
    skills.push({
      name,
      title: text(ui.display_name) || heading || name,
      description,
      summary: text(ui.short_description) || description,
      category:
        text(metadata.category) || inferSkillCategory(name, description),
      prompt: text(ui.default_prompt) || `Use $${name} to help with this task.`,
      minutes: Math.max(1, Math.ceil(body.split(/\s+/).length / 220)),
      files: files.sort((a, b) => {
        if (a.path === "SKILL.md") return -1;
        if (b.path === "SKILL.md") return 1;
        return a.path.localeCompare(b.path);
      }),
    });
  }
  return { skills, repositoryUrl: "https://github.com/niclaflamme/nills" };
}
