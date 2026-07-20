#!/usr/bin/env node
/**
 * build-data.mjs — 一次ソース（content/）から docs/data/exercises.json を組み立てる。
 *
 * ■ 通常モード:  node scripts/build-data.mjs
 *   各書籍の content/<book>/manifest.json（グルーピング定義）を読み、
 *   steps[].sourceFile の本文を焼き込んで docs/data/exercises.json を生成する。
 *   → グルーピング（どのtxtを1演習に束ねるか）や役割・モード等のメタデータは
 *     manifest.json にソースとして残るため、再生成しても壊れない。
 *
 * ■ 雛形生成: node scripts/build-data.mjs --scaffold <bookId>
 *   その書籍の index.md を解析し、章・タイトル・ファイル対応を prefill した
 *   content/<book>/manifest.draft.json を出力する。
 *   これを手で編集（多段演習の束ね・役割・モード等の記入）し、manifest.json にリネームして使う。
 *
 * 依存：なし（Node標準モジュールのみ。Node 16+）
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const DATA_DIR = join(ROOT, "docs", "data");
const BOOKS_FILE = join(DATA_DIR, "books.json");

function loadBooks() {
  if (!existsSync(BOOKS_FILE)) {
    console.error(`books.json が見つかりません: ${BOOKS_FILE}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(BOOKS_FILE, "utf8"));
}

function bookDir(book) {
  return join(CONTENT_DIR, book.sourceDir);
}

// ---- 通常モード：manifest を集約して exercises.json を生成 ----
function compile() {
  const books = loadBooks().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out = [];
  const seenIds = new Set();

  for (const book of books) {
    const manifestPath = join(bookDir(book), "manifest.json");
    if (!existsSync(manifestPath)) {
      console.warn(`- ${book.title}: manifest.json なし（スキップ。--scaffold で雛形生成できます）`);
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const exercises = manifest.exercises ?? [];
    for (const ex of exercises) {
      if (!ex.id) throw new Error(`${book.sourceDir}: id のない演習があります`);
      if (seenIds.has(ex.id)) throw new Error(`重複ID: ${ex.id}`);
      seenIds.add(ex.id);

      const steps = (ex.steps ?? []).map((step, i) => {
        const file = join(bookDir(book), step.sourceFile);
        if (!existsSync(file)) {
          throw new Error(`${ex.id}: sourceFile が見つかりません → content/${book.sourceDir}/${step.sourceFile}`);
        }
        const out = {
          order: step.order ?? i + 1,
          label: step.label ?? "",
          sourceFile: step.sourceFile,
          prompt: readFileSync(file, "utf8").trim(),
        };
        if (step.mode) out.mode = step.mode; // ステップ単位でモードが異なる場合のみ付与
        return out;
      });

      out.push({
        id: ex.id,
        bookId: book.id,
        chapter: ex.chapter ?? "",
        title: ex.title ?? "",
        skillCategories: ex.skillCategories ?? [],
        promptRole: ex.promptRole ?? "",
        mode: ex.mode ?? "normal",
        template: ex.template ?? false,
        difficulty: ex.difficulty ?? null,
        learningObjective: ex.learningObjective ?? "",
        overview: ex.overview ?? "",
        estimatedMinutes: ex.estimatedMinutes ?? null,
        safetyNotes: ex.safetyNotes ?? [],
        reflection: ex.reflection ?? [],
        steps,
        tags: ex.tags ?? [],
      });
    }
    console.log(`✓ ${book.title}: ${exercises.length} 演習`);
  }

  const outFile = join(DATA_DIR, "exercises.json");
  writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`\n生成: docs/data/exercises.json（合計 ${out.length} 演習）`);
}

// ---- 雛形生成：index.md を解析して manifest.draft.json を出力 ----
function scaffold(bookId) {
  const books = loadBooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    console.error(`bookId が books.json にありません: ${bookId}`);
    process.exit(1);
  }
  const indexPath = join(bookDir(book), "index.md");
  if (!existsSync(indexPath)) {
    console.error(`index.md が見つかりません: content/${book.sourceDir}/index.md`);
    process.exit(1);
  }
  const lines = readFileSync(indexPath, "utf8").split(/\r?\n/);
  const exercises = [];
  let chapter = "";
  for (const line of lines) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) { chapter = h[1].trim(); continue; }
    const item = line.match(/^-\s+\*\*(.+?)\*\*\s+`([^`]+)`/);
    if (item) {
      const title = item[1].trim();
      const file = item[2].trim();
      exercises.push({
        id: `${book.id}__${file.replace(/\.txt$/i, "")}`,
        chapter,
        title,                       // index.md から prefill 済み
        skillCategories: [],
        promptRole: "",              // client / evaluator / educator / guide / quizmaster / partner
        mode: "normal",             // normal / study
        template: false,             // [ ] を学習者が埋めるテンプレートなら true
        difficulty: null,
        learningObjective: "",
        overview: "",
        estimatedMinutes: null,
        safetyNotes: [],
        reflection: [],
        steps: [{ order: 1, label: "", sourceFile: file }],
        tags: [],
      });
    }
  }
  const draftPath = join(bookDir(book), "manifest.draft.json");
  writeFileSync(draftPath, JSON.stringify({ bookId: book.id, exercises }, null, 2) + "\n", "utf8");
  console.log(`生成: content/${book.sourceDir}/manifest.draft.json（${exercises.length} 演習の雛形）`);
  console.log("→ 束ね方・役割・モード等を手で整え、manifest.json にリネームしてください。");
}

// ---- entry ----
const args = process.argv.slice(2);
const scaffoldIdx = args.indexOf("--scaffold");
if (scaffoldIdx !== -1) {
  scaffold(args[scaffoldIdx + 1]);
} else {
  compile();
}
