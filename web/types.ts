export interface SkillFile {
  path: string;
  content: string | null;
  body: string | null;
}

export interface Skill {
  name: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  prompt: string;
  minutes: number;
  files: SkillFile[];
}

export interface Catalog {
  skills: Skill[];
  repositoryUrl: string;
}
