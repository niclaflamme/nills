import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { loadCatalog } from "./web/catalog.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const skillsDirectory = resolve(root, "skills");
const moduleId = "virtual:nills-catalog";
const resolvedModuleId = `\0${moduleId}`;

function catalogPlugin(): Plugin {
  return {
    name: "nills-catalog",
    resolveId(id) {
      if (id === moduleId) return resolvedModuleId;
    },
    async load(id) {
      if (id !== resolvedModuleId) return;
      return `export default ${JSON.stringify(await loadCatalog(skillsDirectory))};`;
    },
    configureServer(server) {
      server.watcher.add(skillsDirectory);
      server.watcher.on("all", (_event, path) => {
        if (path !== skillsDirectory && !path.startsWith(`${skillsDirectory}/`))
          return;
        const module = server.moduleGraph.getModuleById(resolvedModuleId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}

export default defineConfig({ plugins: [catalogPlugin()], base: "./" });
