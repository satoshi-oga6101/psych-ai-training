#!/usr/bin/env node
/**
 * validate-data.mjs — docs/data/exercises.json を検証する。
 * push 前に実行して、必須項目の欠落・enum違反・参照切れを検出する。
 *
 *   node scripts/validate-data.mjs
 *
 * 検査内容：
 *   - id の重複／欠落
 *   - bookId が books.json に存在するか
 *   - promptRole / mode が許可値か
 *   - steps が1つ以上あり、各 sourceFile が content/<book>/ に実在するか
 *   - steps[].prompt（焼き込み本文）が空でないか
 *   - learningObjective / title の空欄は警告（エラーにはしない）
 *
 * 終了コード：エラーがあれば 1
 * 依存：なし（Node標準モジュールのみ）
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const DATA_DIR = join(ROOT, "docs", "data");

const VALID_ROLES = ["client", "evaluator", "educator", "guide", "quizmaster", "partner"];
const VALID_MODES = ["normal", "study"];

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

function main() {
  const books = read(join(DATA_DIR, "books.json"));
  const exercises = read(join(DATA_DIR, "exercises.json"));
  const bookById = new Map(books.map((b) => [b.id, b]));

  const errors = [];
  const warnings = [];
  const ids = new Set();

  exercises.forEach((ex, i) => {
    const where = ex.id || `#${i}`;
    if (!ex.id) errors.push(`${where}: id がありません`);
    else if (ids.has(ex.id)) errors.push(`${where}: id が重複しています`);
    else ids.add(ex.id);

    const book = bookById.get(ex.bookId);
    if (!book) errors.push(`${where}: bookId "${ex.bookId}" が books.json にありません`);

    if (!VALID_ROLES.includes(ex.promptRole))
      errors.push(`${where}: promptRole "${ex.promptRole}" は不正（許可: ${VALID_ROLES.join(", ")}）`);
    if (!VALID_MODES.includes(ex.mode))
      errors.push(`${where}: mode "${ex.mode}" は不正（許可: ${VALID_MODES.join(", ")}）`);

    if (!Array.isArray(ex.steps) || ex.steps.length === 0) {
      errors.push(`${where}: steps がありません`);
    } else if (book) {
      ex.steps.forEach((s) => {
        const f = join(CONTENT_DIR, book.sourceDir, s.sourceFile || "");
        if (!s.sourceFile) errors.push(`${where}: step に sourceFile がありません`);
        else if (!existsSync(f)) errors.push(`${where}: sourceFile が実在しません → content/${book.sourceDir}/${s.sourceFile}`);
        if (!s.prompt || !s.prompt.trim()) errors.push(`${where}: step "${s.sourceFile}" の prompt（本文）が空です`);
      });
    }

    if (!ex.title || !ex.title.trim()) warnings.push(`${where}: title が空です`);
    if (!ex.learningObjective || !ex.learningObjective.trim()) warnings.push(`${where}: learningObjective が空です`);
    if (!Array.isArray(ex.skillCategories) || ex.skillCategories.length === 0)
      warnings.push(`${where}: skillCategories が空です`);
  });

  console.log(`検査対象: ${exercises.length} 演習 / ${books.length} 書籍\n`);
  if (warnings.length) {
    console.log(`⚠ 警告 ${warnings.length} 件:`);
    warnings.forEach((w) => console.log(`  - ${w}`));
    console.log("");
  }
  if (errors.length) {
    console.log(`✗ エラー ${errors.length} 件:`);
    errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  }
  console.log("✓ エラーなし。");
}

main();
