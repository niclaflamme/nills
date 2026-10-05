import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  File,
  FileCode2,
  FileText,
  FolderOpen,
  GitFork,
  Grid2X2,
  Layers3,
  List,
  Moon,
  Search,
  Sun,
  Terminal,
  Type,
  X,
} from "lucide-react";
import catalog from "virtual:nills-catalog";
import { parseRoute, resolveDocumentLink, routeHash } from "./navigation";
import { renderMarkdown } from "./markdown";
import type { Skill } from "./types";
import "./styles.css";

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("nills:bookmarks") || "[]",
    );
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function readTheme() {
  try {
    return localStorage.getItem("nills:theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function CategoryIcon({
  category,
  size = 18,
}: {
  category: string;
  size?: number;
}) {
  const Icon =
    category === "Engineering"
      ? Code2
      : category === "Writing"
        ? Type
        : Layers3;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

function categoryClass(category: string) {
  return category === "Engineering"
    ? "engineering"
    : category === "Writing"
      ? "writing"
      : "general";
}

function App() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState(readSaved);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("title");
  const [theme, setTheme] = useState(readTheme);
  const [sourceView, setSourceView] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const activeSkill = catalog.skills.find(
    (skill) => skill.name === route.skill,
  );
  const categories = Array.from(
    new Set(catalog.skills.map((skill) => skill.category)),
  ).sort();
  const savedCount = catalog.skills.filter((skill) =>
    bookmarks.includes(skill.name),
  ).length;
  const fileCount = catalog.skills.reduce(
    (total, skill) => total + skill.files.length,
    0,
  );

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(location.hash));
    addEventListener("hashchange", onHashChange);
    return () => removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nills:theme", theme);
    } catch {
      /* Session-only theme. */
    }
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const editing =
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
      if (
        ((event.metaKey || event.ctrlKey) && event.key === "k") ||
        (!editing && event.key === "/")
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (
        event.key === "Escape" &&
        document.activeElement === searchRef.current
      ) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setSourceView(false);
    if (!route.section) window.scrollTo({ top: 0 });
  }, [route.skill, route.file]);

  useEffect(() => {
    if (!route.section || sourceView) return;
    const frame = requestAnimationFrame(() => {
      const headings =
        articleRef.current?.querySelectorAll<HTMLElement>("[id]");
      const heading = Array.from(headings || []).find(
        (element) => element.id === route.section,
      );
      heading?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [route, sourceView]);

  useEffect(() => {
    document.title = activeSkill
      ? `${activeSkill.title} — nills`
      : "nills — a small library of better ways";
  }, [activeSkill]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filteredSkills = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return catalog.skills
      .filter((skill) => {
        const haystack = [
          skill.name,
          skill.title,
          skill.description,
          skill.category,
          ...skill.files.map((file) => `${file.path} ${file.content || ""}`),
        ]
          .join(" ")
          .toLowerCase();
        return (
          (category === "All" || skill.category === category) &&
          (!savedOnly || bookmarks.includes(skill.name)) &&
          terms.every((term) => haystack.includes(term))
        );
      })
      .sort((a, b) =>
        sort === "length"
          ? a.minutes - b.minutes || a.title.localeCompare(b.title)
          : a.title.localeCompare(b.title),
      );
  }, [query, category, savedOnly, bookmarks, sort]);

  function browse(nextCategory = "All", nextSavedOnly = false) {
    setCategory(nextCategory);
    setSavedOnly(nextSavedOnly);
    location.hash = "";
  }

  function toggleBookmark(skill: Skill) {
    const next = bookmarks.includes(skill.name)
      ? bookmarks.filter((name) => name !== skill.name)
      : [...bookmarks, skill.name];
    setBookmarks(next);
    try {
      localStorage.setItem("nills:bookmarks", JSON.stringify(next));
    } catch {
      /* Session-only bookmarks. */
    }
  }

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(message);
    } catch {
      setToast("Clipboard unavailable. You can copy from the source view.");
    }
  }

  const file = activeSkill?.files.find((file) => file.path === route.file);
  const markdown = useMemo(() => {
    if (!file?.body || !file.path.toLowerCase().endsWith(".md")) return null;
    const body =
      file.path === "SKILL.md"
        ? file.body.replace(/^#\s+.+\r?\n/, "")
        : file.body;
    return renderMarkdown(body, (href) => {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href)) return href;
      const target = resolveDocumentLink(file.path, href);
      return target && activeSkill
        ? routeHash(activeSkill.name, target.file, target.section)
        : null;
    });
  }, [file, activeSkill]);

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Library navigation">
        <a className="brand" href="#" aria-label="nills home">
          <span className="brand-mark">n</span>
          <span>
            nills<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="sidebar-caption">A personal skill library</p>
        <div className="sidebar-section-label">YOUR COLLECTION</div>
        <nav className="library-nav">
          <button
            className={
              !activeSkill && !savedOnly && category === "All"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => browse()}
          >
            <Layers3 size={17} />
            <span>All skills</span>
            <span className="nav-count">
              {catalog.skills.length.toString().padStart(2, "0")}
            </span>
          </button>
          <button
            className={
              !activeSkill && savedOnly ? "nav-item active" : "nav-item"
            }
            onClick={() => browse("All", true)}
          >
            <Bookmark size={17} />
            <span>Bookmarked</span>
            <span className="nav-count">
              {savedCount.toString().padStart(2, "0")}
            </span>
          </button>
        </nav>
        <div className="category-navigation">
          <div className="sidebar-section-label">EXPLORE BY DISCIPLINE</div>
          {categories.map((item) => (
            <button
              key={item}
              className={
                !activeSkill && category === item && !savedOnly
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => browse(item)}
            >
              <CategoryIcon category={item} size={17} />
              <span>{item}</span>
              <span
                className="category-dot"
                data-category={categoryClass(item)}
              />
            </button>
          ))}
        </div>
        <div className="sidebar-note">
          <span className="little-asterisk">✳</span>
          <p>
            Good habits, collected.
            <br />
            Ready for your next task.
          </p>
          <div className="sidebar-note-rule" />
          <span>One repo. Every agent.</span>
        </div>
        <a
          className="repo-link"
          href={catalog.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitFork size={16} />
          <span>View repository</span>
          <ArrowUpRight size={14} />
        </a>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="breadcrumb-icon">
              <FolderOpen size={16} />
            </span>
            <button onClick={() => browse()}>Library</button>
            {activeSkill ? (
              <>
                <span className="breadcrumb-slash">/</span>
                <span className="breadcrumb-current">{activeSkill.name}</span>
              </>
            ) : (
              <>
                <span className="breadcrumb-slash">/</span>
                <span className="breadcrumb-current">
                  {savedOnly
                    ? "Bookmarked"
                    : category === "All"
                      ? "All skills"
                      : category}
                </span>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Search skills"
                placeholder="Search the library…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (route.skill) location.hash = "";
                }}
              />
              {query ? (
                <button
                  className="clear-search"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd>⌘ K</kbd>
              )}
            </div>
            <button
              className="icon-button theme-toggle"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <main
          id="main-content"
          className={activeSkill ? "main-content reader-main" : "main-content"}
          tabIndex={-1}
        >
          {route.skill && !activeSkill ? (
            <div className="empty-state">
              <BookOpen size={32} />
              <h1>That skill isn’t in the library.</h1>
              <p>It may have been renamed or removed.</p>
              <button className="primary-button" onClick={() => browse()}>
                Back to the collection <ArrowRight size={16} />
              </button>
            </div>
          ) : activeSkill ? (
            <>
              <button
                className="back-link"
                onClick={() => browse(category, savedOnly)}
              >
                <ArrowLeft size={15} /> Back to the collection
              </button>
              <div className="reader-heading">
                <div>
                  <span
                    className={`category-label ${categoryClass(activeSkill.category)}`}
                  >
                    <CategoryIcon category={activeSkill.category} size={14} />
                    {activeSkill.category}
                  </span>
                  <h1>{activeSkill.title}</h1>
                  <p>{activeSkill.summary}</p>
                  <div className="reader-meta">
                    <span>
                      <Clock3 size={14} />
                      {activeSkill.minutes} min read
                    </span>
                    <span>
                      <FolderOpen size={14} />
                      {activeSkill.files.length} files
                    </span>
                    <code>${activeSkill.name}</code>
                  </div>
                </div>
                <button
                  className={`bookmark-button reader-bookmark ${bookmarks.includes(activeSkill.name) ? "is-saved" : ""}`}
                  aria-label={`${bookmarks.includes(activeSkill.name) ? "Remove bookmark for" : "Bookmark"} ${activeSkill.title}`}
                  aria-pressed={bookmarks.includes(activeSkill.name)}
                  onClick={() => toggleBookmark(activeSkill)}
                >
                  <Bookmark size={19} />
                </button>
              </div>
              <div className="invocation">
                <Terminal size={18} />
                <span>Give your agent a starting point</span>
                <button
                  onClick={() =>
                    copy(activeSkill.prompt, "Starting prompt copied")
                  }
                >
                  <Copy size={14} /> Copy prompt
                </button>
              </div>
              <div className="reader-layout">
                <div className="document-panel">
                  <div className="document-toolbar">
                    <span>
                      <FileText size={15} />
                      {route.file}
                    </span>
                    <div>
                      <button
                        className={
                          sourceView ? "text-button selected" : "text-button"
                        }
                        aria-pressed={sourceView}
                        onClick={() => setSourceView(!sourceView)}
                      >
                        <Code2 size={14} />
                        {sourceView ? "Reading view" : "Source"}
                      </button>
                      {file?.content !== null &&
                        file?.content !== undefined && (
                          <button
                            className="icon-button"
                            aria-label="Copy file contents"
                            onClick={() =>
                              copy(file.content!, "File contents copied")
                            }
                          >
                            <Copy size={14} />
                          </button>
                        )}
                    </div>
                  </div>
                  {!file ? (
                    <div className="document-empty">
                      <File size={28} />
                      <h2>File not found</h2>
                      <p>This file is no longer part of the skill.</p>
                      <a href={routeHash(activeSkill.name)}>
                        Open the guide <ArrowRight size={14} />
                      </a>
                    </div>
                  ) : file.content === null ? (
                    <div className="document-empty">
                      <File size={28} />
                      <h2>No text preview</h2>
                      <p>This file is a binary asset.</p>
                      <a
                        href={`${catalog.repositoryUrl}/blob/HEAD/skills/${encodeURIComponent(activeSkill.name)}/${file.path.split("/").map(encodeURIComponent).join("/")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on GitHub <ArrowUpRight size={14} />
                      </a>
                    </div>
                  ) : sourceView || !markdown ? (
                    <pre className="source-code">
                      <code>{file.content}</code>
                    </pre>
                  ) : (
                    <article
                      ref={articleRef}
                      className="prose"
                      dangerouslySetInnerHTML={{ __html: markdown.html }}
                    />
                  )}
                </div>
                <aside
                  className="reader-aside"
                  aria-label="Skill files and sections"
                >
                  <div className="reader-aside-label">
                    IN THIS SKILL{" "}
                    <span>
                      {activeSkill.files.length.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <nav className="file-nav">
                    {activeSkill.files.map((item) => (
                      <a
                        key={item.path}
                        className={
                          item.path === route.file
                            ? "file-link selected"
                            : "file-link"
                        }
                        href={routeHash(activeSkill.name, item.path)}
                        aria-label={
                          item.path === "SKILL.md"
                            ? "Skill guide SKILL.md"
                            : item.path
                        }
                        aria-current={
                          item.path === route.file ? "page" : undefined
                        }
                      >
                        {item.path.endsWith(".md") ? (
                          <FileText size={15} />
                        ) : (
                          <FileCode2 size={15} />
                        )}
                        <span>
                          {item.path === "SKILL.md"
                            ? "Skill guide"
                            : item.path.split("/").at(-1)}
                          <small>
                            {item.path.includes("/")
                              ? item.path.split("/").slice(0, -1).join("/")
                              : item.path}
                          </small>
                        </span>
                        {item.path === route.file && <ArrowRight size={13} />}
                      </a>
                    ))}
                  </nav>
                  {markdown && !sourceView && markdown.outline.length > 0 && (
                    <>
                      <div className="reader-aside-label outline-label">
                        ON THIS PAGE
                      </div>
                      <nav className="outline-nav">
                        {markdown.outline.map((heading) => (
                          <a
                            key={heading.id}
                            href={routeHash(
                              activeSkill.name,
                              route.file,
                              heading.id,
                            )}
                            className={`${route.section === heading.id ? "selected" : ""} ${heading.depth === 3 ? "nested" : ""}`}
                            aria-current={
                              route.section === heading.id
                                ? "location"
                                : undefined
                            }
                          >
                            {heading.title}
                          </a>
                        ))}
                      </nav>
                    </>
                  )}
                  <p className="file-note">
                    The original files, together.
                    <br />
                    One small skill, ready to use.
                  </p>
                </aside>
              </div>
            </>
          ) : (
            <>
              <section className="hero" aria-labelledby="library-title">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span />
                    THE NILLS COLLECTION
                  </div>
                  <h1 id="library-title">
                    Small skills.
                    <br />
                    <em>Better work.</em>
                  </h1>
                  <p>
                    A few good ways to write, think, and build.
                    <br />
                    Collected in one place. Ready when you are.
                  </p>
                  <div className="hero-meta">
                    <span>
                      <Layers3 size={15} />
                      {catalog.skills.length} skills
                    </span>
                    <span className="meta-divider" />
                    <span>
                      <FolderOpen size={15} />
                      {fileCount} files to explore
                    </span>
                    <span className="meta-divider" />
                    <span className="collection-status">
                      <span />
                      Always growing
                    </span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <span className="art-plus art-plus-one">+</span>
                  <span className="art-plus art-plus-two">+</span>
                  <div className="art-card art-card-back">
                    <div className="art-card-top">
                      <Code2 size={20} />
                      <span>01</span>
                    </div>
                    <div className="art-line long" />
                    <div className="art-line medium" />
                    <div className="art-line short" />
                  </div>
                  <div className="art-card art-card-front">
                    <div className="art-card-top">
                      <Type size={22} />
                      <span>02</span>
                    </div>
                    <div className="art-title">A better way.</div>
                    <div className="art-line long" />
                    <div className="art-line medium" />
                    <div className="art-card-bottom">
                      <span>KEEP IT SIMPLE</span>
                      <ArrowUpRight size={17} />
                    </div>
                  </div>
                  <span className="art-spark">✳</span>
                  <span className="art-caption">
                    a little knowledge goes a long way
                  </span>
                </div>
              </section>

              <section
                className="collection-section"
                aria-labelledby="collection-title"
              >
                <div className="collection-heading">
                  <div>
                    <h2 id="collection-title">
                      {savedOnly
                        ? "Your bookmarks"
                        : category === "All"
                          ? "Explore the collection"
                          : `${category} skills`}
                    </h2>
                    <p>
                      {savedOnly
                        ? "The good ones you want to come back to."
                        : "Useful instructions. Thoughtfully kept."}
                    </p>
                  </div>
                  <div className="view-controls">
                    <span className="collection-count" aria-live="polite">
                      {filteredSkills.length}{" "}
                      {filteredSkills.length === 1 ? "skill" : "skills"}
                    </span>
                    <div
                      className="layout-toggle"
                      aria-label="Collection layout"
                    >
                      <button
                        className={layout === "grid" ? "selected" : ""}
                        aria-label="Grid view"
                        aria-pressed={layout === "grid"}
                        onClick={() => setLayout("grid")}
                      >
                        <Grid2X2 size={16} />
                      </button>
                      <button
                        className={layout === "list" ? "selected" : ""}
                        aria-label="List view"
                        aria-pressed={layout === "list"}
                        onClick={() => setLayout("list")}
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="collection-filters">
                  <div className="filter-tabs">
                    <button
                      className={!savedOnly ? "selected" : ""}
                      onClick={() => setSavedOnly(false)}
                    >
                      All skills <span>{catalog.skills.length}</span>
                    </button>
                    <button
                      className={savedOnly ? "selected" : ""}
                      onClick={() => setSavedOnly(true)}
                    >
                      Bookmarked <span>{savedCount}</span>
                    </button>
                  </div>
                  <div className="filter-selects">
                    <label className="mobile-category">
                      <span className="sr-only">Filter by discipline</span>
                      <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                      >
                        <option value="All">All disciplines</option>
                        {categories.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label className="sort-control">
                      <ArrowDownAZ size={14} />
                      <span className="sr-only">Sort skills</span>
                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                      >
                        <option value="title">Alphabetical</option>
                        <option value="length">Shortest read</option>
                      </select>
                      <ChevronDown size={13} />
                    </label>
                  </div>
                </div>
                {query && (
                  <p className="search-results" aria-live="polite">
                    Searching guides and supporting files for{" "}
                    <strong>“{query}”</strong>
                  </p>
                )}
                <div
                  className={`skill-grid ${layout === "list" ? "list-view" : ""}`}
                >
                  {filteredSkills.map((skill, index) => (
                    <article
                      className={`skill-card ${categoryClass(skill.category)}`}
                      key={skill.name}
                    >
                      <button
                        className={`bookmark-button ${bookmarks.includes(skill.name) ? "is-saved" : ""}`}
                        aria-label={`${bookmarks.includes(skill.name) ? "Remove bookmark for" : "Bookmark"} ${skill.title}`}
                        aria-pressed={bookmarks.includes(skill.name)}
                        onClick={() => toggleBookmark(skill)}
                      >
                        <Bookmark size={17} />
                      </button>
                      <a href={routeHash(skill.name)} className="card-body">
                        <div className="card-top">
                          <div className="skill-icon">
                            <CategoryIcon category={skill.category} size={23} />
                          </div>
                          <span className="card-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <span
                          className={`category-label ${categoryClass(skill.category)}`}
                        >
                          {skill.category}
                        </span>
                        <h3>{skill.title}</h3>
                        <p>{skill.summary}</p>
                        <div className="card-details">
                          <code>{skill.name}</code>
                          <span>
                            <Clock3 size={13} />
                            {skill.minutes} min read
                          </span>
                        </div>
                        <div className="card-footer">
                          <span>
                            <FolderOpen size={14} />
                            {skill.files.length} files included
                          </span>
                          <span className="open-skill">
                            Explore skill <ArrowUpRight size={16} />
                          </span>
                        </div>
                      </a>
                    </article>
                  ))}
                </div>
                {!filteredSkills.length && (
                  <div className="empty-state">
                    <Search size={29} />
                    <h3>
                      {savedOnly && !query
                        ? "Save a skill for later."
                        : "No skills found."}
                    </h3>
                    <p>
                      {savedOnly && !query
                        ? "Use the bookmark icon on a skill to keep it here."
                        : "Try a different phrase or explore the full collection."}
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => {
                        setQuery("");
                        browse();
                      }}
                    >
                      Explore all skills <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </section>
              <div className="collection-bottom">
                <div className="collection-bottom-icon">
                  <BookOpen size={21} strokeWidth={1.4} />
                </div>
                <div>
                  <h3>A library, built a little at a time.</h3>
                  <p>Every skill is a small investment in how you work.</p>
                </div>
                <a
                  href={catalog.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore on GitHub <ArrowUpRight size={15} />
                </a>
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>Made for the way you work.</span>
            <span>
              <span className="footer-n">n.</span> Nic’s skills, thoughtfully
              collected.
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
