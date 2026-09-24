const fs = require("node:fs");
const ts = require("typescript");

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function literal(node) {
  if (!node) return null;
  if (ts.isJsxExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression);
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : null;
}

function objectContext(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return null;
  const property = node.properties.find(
    (property) => ts.isPropertyAssignment(property) && property.name.text === "context",
  );
  return property ? literal(property.initializer) : null;
}

function translationBindings(sourceFile) {
  const bindings = {
    runtimes: new Set(),
    singular: new Set(),
    plural: new Set(),
    hooks: new Set(),
    components: new Set(),
    translatorTypes: new Set(),
  };

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const moduleName = literal(statement.moduleSpecifier);
    if (!moduleName || (!["i18next", "react-i18next"].includes(moduleName) && !moduleName.endsWith("/i18n"))) continue;

    const clause = statement.importClause;
    if (moduleName === "i18next" && clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const specifier of clause.namedBindings.elements) {
        if ((specifier.propertyName?.text ?? specifier.name.text) === "TFunction") {
          bindings.translatorTypes.add(specifier.name.text);
        }
      }
    }
    if (clause.isTypeOnly) continue;
    if (clause.name) bindings.runtimes.add(clause.name.text);
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings) && moduleName === "i18next") {
      bindings.runtimes.add(clause.namedBindings.name.text);
    }
    if (!clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;

    const groups = {
      t: bindings.singular,
      tn: bindings.plural,
      useTranslation: bindings.hooks,
      Trans: bindings.components,
    };
    for (const specifier of clause.namedBindings.elements) {
      if (!specifier.isTypeOnly) groups[specifier.propertyName?.text ?? specifier.name.text]?.add(specifier.name.text);
    }
  }

  visit(sourceFile, (node) => {
    if (
      ts.isParameter(node) &&
      ts.isIdentifier(node.name) &&
      node.type &&
      ts.isTypeReferenceNode(node.type) &&
      ts.isIdentifier(node.type.typeName) &&
      bindings.translatorTypes.has(node.type.typeName.text)
    ) {
      bindings.singular.add(node.name.text);
    }
    if (!ts.isVariableDeclaration(node) || !ts.isObjectBindingPattern(node.name)) return;
    const initializer = node.initializer;
    if (!initializer || !ts.isCallExpression(initializer) || !ts.isIdentifier(initializer.expression)) return;
    if (!bindings.hooks.has(initializer.expression.text)) return;

    for (const element of node.name.elements) {
      if ((element.propertyName?.text ?? element.name.text) === "t" && ts.isIdentifier(element.name)) {
        bindings.singular.add(element.name.text);
      }
    }
  });

  return bindings;
}

function callMessage(node, bindings) {
  const callee = node.expression;
  const args = node.arguments;
  if (ts.isIdentifier(callee) && bindings.plural.has(callee.text)) {
    const singular = literal(args[0]);
    const plural = literal(args[1]);
    return singular !== null && plural !== null
      ? { msgid: singular, msgid_plural: plural, msgctxt: objectContext(args[3]) }
      : null;
  }

  const isSingular = ts.isIdentifier(callee) && bindings.singular.has(callee.text);
  const isRuntime =
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "t" &&
    ts.isIdentifier(callee.expression) &&
    bindings.runtimes.has(callee.expression.text);
  if (!isSingular && !isRuntime) return null;

  const singular = literal(args[0]);
  return singular !== null ? { msgid: singular, msgctxt: objectContext(args[1]) } : null;
}

function jsxMessage(node, bindings) {
  if (!ts.isIdentifier(node.tagName) || !bindings.components.has(node.tagName.text)) return null;
  const key = node.attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.text === "i18nKey",
  );
  const msgid = key ? literal(key.initializer) : null;
  return msgid !== null ? { msgid } : null;
}

function extract(source, path) {
  // Avoid parsing files that cannot import the translation runtime.
  if (!source.includes("i18next") && !source.includes("/i18n")) return [];
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  if (sourceFile.parseDiagnostics.length) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
    throw new Error(
      `${path}:${line + 1}:${character + 1}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`,
    );
  }

  const bindings = translationBindings(sourceFile);
  const messages = [];
  visit(sourceFile, (node) => {
    let message;
    if (ts.isCallExpression(node)) message = callMessage(node, bindings);
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) message = jsxMessage(node, bindings);
    if (message) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      messages.push({ ...message, path, line: line + 1 });
    }
  });
  return messages;
}

try {
  const [mode, ...args] = process.argv.slice(2);
  if (mode !== "--files" && mode !== "--source")
    throw new Error("Expected --files <paths...> or --source <path> <source>");
  const messages =
    mode === "--files"
      ? args.flatMap((path) => extract(fs.readFileSync(path, "utf8"), path))
      : extract(args[1], args[0]);
  process.stdout.write(JSON.stringify(messages));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
