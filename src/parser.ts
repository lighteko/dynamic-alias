import fs from "fs";
import path from "path";
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import generate from '@babel/generator';

type ImportStatement = {
  type: "static" | "side-effect" | "require" | "dynamic";
  module: string;
  statement: string;
};

export function parseFile(filePath: string) {
  console.log(`📂 파일 분석 시작: ${filePath}`);
  try {
    const code = fs.readFileSync(filePath, "utf-8");

    const importStatements = extractImports(code);

    console.log("📌 발견된 import/require:");
    console.log(importStatements);

    return importStatements;
  } catch (error) {
    console.error(`❌ 파일 읽기 오류: ${filePath}`, error);
    return [];
  }
}

function extractImports(code: string): ImportStatement[] {
  const results: ImportStatement[] = [];
  // Babel을 사용해 AST로 파싱함
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "dynamicImport"],
  });

  traverse(ast, {
    // static import 및 side-effect import 처리 (둘 다 ImportDeclaration 노드임)
    ImportDeclaration({ node }) {
      const generatedCode = generate(node, {}, code).code;
      const type = node.specifiers && node.specifiers.length > 0 ? "static" : "side-effect";
      results.push({
        type,
        module: node.source.value,
        statement: generatedCode.trim().replace("\n", ""),
      });
    },
    // dynamic import (import("module"))
    ImportExpression({ node }) {
      if (t.isStringLiteral(node.source)) {
        const generatedCode = generate(node, {}, code).code;
        results.push({
          type: "dynamic",
          module: node.source.value,
          statement: generatedCode.trim().replace("\n", ""),
        });
      }
    },
    // require 호출 (require("module"))
    CallExpression({ node }) {
      if (
        t.isIdentifier(node.callee, { name: "require" }) &&
        node.arguments.length === 1 &&
        t.isStringLiteral(node.arguments[0])
      ) {
        const generatedCode = generate(node, {}, code).code;
        results.push({
          type: "require",
          module: node.arguments[0].value,
          statement: generatedCode.trim().replace("\n", ""),
        });
      }
    },
  });

  return results;
}

// TEST
const codeLines = [
  `import { foo,`,
  `  bar } from "module-a";`,
  `import "module-b";`,
  `const baz = require("module-c");`,
  `const dyn = import("module-d");`,
];

console.log(extractImports(codeLines.join("\n")));
