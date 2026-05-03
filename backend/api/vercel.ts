import path from "path";
import type { RequestHandler } from "express";

type ResolveFilename = (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options?: unknown,
) => string;

const nodeModule = module.constructor as typeof module.constructor & {
  _resolveFilename: ResolveFilename;
};

const originalResolveFilename = nodeModule._resolveFilename;
const backendRoot = path.resolve(__dirname, "..");

const exactAliases: Record<string, string> = {
  "@errors": "errors",
  "@models": "models",
  "@utils": "utils",
};

const prefixAliases: Record<string, string> = {
  "@api/": "api/",
  "@auth/": "auth/",
  "@businessLogic/": "businessLogic/",
  "@dataAccess/": "dataAccess/",
};

nodeModule._resolveFilename = function resolveBackendAlias(
  request,
  parent,
  isMain,
  options,
) {
  const exactAlias = exactAliases[request];
  if (exactAlias) {
    return originalResolveFilename.call(
      this,
      path.join(backendRoot, exactAlias),
      parent,
      isMain,
      options,
    );
  }

  for (const [alias, target] of Object.entries(prefixAliases)) {
    if (request.startsWith(alias)) {
      return originalResolveFilename.call(
        this,
        path.join(backendRoot, target, request.slice(alias.length)),
        parent,
        isMain,
        options,
      );
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const app = require("./app").default as RequestHandler;

export default app;
