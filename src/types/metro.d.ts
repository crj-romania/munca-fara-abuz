interface RequireContext {
  keys(): string[];
  <T = unknown>(id: string): T;
}

interface NodeRequire {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
  ): RequireContext;
}

