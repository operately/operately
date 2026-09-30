import ts from "typescript";

const configPath = "tsconfig.build.json";
const diagnosticFormatHost = {
  getCanonicalFileName: (name) => name,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

if (process.argv.includes("--watch")) {
  watchDeclarations();
} else {
  buildDeclarations();
}

function buildDeclarations() {
  const config = readCompilerConfig();
  const program = ts.createProgram(config.fileNames, config.options);
  const hasErrors = emitDeclarations(program);

  if (hasErrors) process.exitCode = 1;
}

function watchDeclarations() {
  const host = ts.createWatchCompilerHost(configPath, {}, ts.sys, undefined, undefined, undefined, {
    watchFile: ts.WatchFileKind.DynamicPriorityPolling,
    watchDirectory: ts.WatchDirectoryKind.DynamicPriorityPolling,
  });
  host.afterProgramCreate = (builder) => {
    emitDeclarations(builder.getProgram());
  };
  ts.createWatchProgram(host);
}

function readCompilerConfig() {
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        reportDiagnostics([diagnostic]);
        process.exit(1);
      },
    },
  );

  if (!config) process.exit(1);
  return config;
}

function emitDeclarations(program) {
  const declarationsOnly = true;
  const transformers = { afterDeclarations: [rewriteIconImports] };
  const result = program.emit(undefined, undefined, undefined, declarationsOnly, transformers);
  const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics];

  reportDiagnostics(diagnostics);
  return diagnostics.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
}

function reportDiagnostics(diagnostics) {
  if (diagnostics.length === 0) return;
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticFormatHost));
}

// Runtime imports use Tabler's per-icon paths, but declarations must use its
// public entry point so consumers can resolve the icon types.
function rewriteIconImports(context) {
  function visit(node) {
    if (isPrivateIconImport(node)) return createPublicIconImport(node, context.factory);
    return ts.visitEachChild(node, visit, context);
  }

  return (sourceFile) => ts.visitNode(sourceFile, visit);
}

function isPrivateIconImport(node) {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    /^@tabler\/icons-react\/dist\/esm\/icons\/\w+\.mjs$/.test(node.moduleSpecifier.text) &&
    node.importClause?.name !== undefined
  );
}

function createPublicIconImport(node, factory) {
  // Keep a value import so the exported icons remain usable as JSX components.
  const iconSpecifier = factory.createImportSpecifier(false, undefined, node.importClause.name);
  const namedImports = factory.createNamedImports([iconSpecifier]);
  const importClause = factory.createImportClause(false, undefined, namedImports);

  return factory.updateImportDeclaration(
    node,
    node.modifiers,
    importClause,
    factory.createStringLiteral("@tabler/icons-react"),
    node.attributes,
  );
}
