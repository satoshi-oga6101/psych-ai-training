#!/usr/bin/env node
/**
 * build-data.mjs — 一次ソース（content/）から演習データの「雛形（ドラフト）」を生成する。
 *
 * やること：
 *   content/<書籍>/ の *.txt を読み、1ファイル＝1ドラフト演習として
 *   docs/data/exercises.draft.json を書き出す。プロンプト本文も焼き込む。
 *
 * やらないこと（＝人手で行う）：
 *   - 多段演習のグルーピング（複数txtを1演習に束ねる）
 *   - 学習目標・役割(promptRole)・モード・カテゴリ等のメタデータ付与
 *
 * 使い方：
 *   node scripts/build-data.mjs
 *
 * 出力：
 *   docs/data/exercises.draft.json（.gitignore対象。人手で docs/data/exercises.json に整える）
 *
 * 依存：なし（Node標準モジュールのみ。Node 16+）
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const OUT_FILE = join(ROOT, "docs", "data", "exercises.draft.json");
const BOOKS_FILE = join(ROOT, "docs", "data", "books.json");

// 自然順ソート（prompt_2 < prompt_10、AI-I-2 < AI-I-11 のように数値を数として比較）
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function loadBooks() {
  if (!existsSync(BOOKS_FILE)) {
    console.error(`books.json が見つかりません: ${BOOKS_FILE}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(BOOKS_FILE, "utf8"));
}

function main() {
  const books = loadBooks();
  const drafts = [];
  let fileCount = 0;

  for (const book of books.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    const dir = join(CONTENT_DIR, book.sourceDir);
    if (!existsSync(dir)) {
      console.warn(`⚠ フォルダなし（スキップ）: content/${book.sourceDir}`);
      continue;
    }
    const files = readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".txt") && f.toLowerCase() !== "readme.txt")
      .sort(naturalCompare);

    for (const file of files) {
      const prompt = readFileSync(join(dir, file), "utf8").trim();
      const preview = prompt.replace(/\s+/g, " ").slice(0, 60);
      fileCount++;
      drafts.push({
        id: `${book.id}__${file.replace(/\.txt$/i, "")}`,
        bookId: book.id,
        chapter: "",                 // ← index.md を見て人手で補う
        title: "",                   // ←
        skillCategories: [],         // ←
        promptRole: "",              // ← client / evaluator / educator / guide / quizmaster / partner
        mode: "",                    // ← normal / study
        difficulty: null,            // 当面 null（plan.md §4.4）
        learningObjective: "",       // ←
        overview: "",                // ←
        estimatedMinutes: null,      // 当面 null
        safetyNotes: [],
        reflection: [],
        steps: [
          { order: 1, label: "", sourceFile: file, prompt }
        ],
        tags: [],
        _preview: preview            // 人手作業の目印。最終版では削除してよい
      });
    }
    console.log(`✓ ${book.title}: ${files.length} ファイル`);
  }

  writeFileSync(OUT_FILE, JSON.stringify(drafts, null, 2) + "\n", "utf8");
  console.log(`\n生成: docs/data/exercises.draft.json（${fileCount} 件のドラフト演習）`);
  console.log("→ このドラフトから docs/data/exercises.json に移し、グルーピングとメタデータを人手で整えてください。");
}

main();
