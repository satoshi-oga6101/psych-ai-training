# scripts

`content/`（一次ソース）から `docs/data/exercises.json`（サイトが読むデータ）を作るためのツール群。依存パッケージなし（Node 16+ の標準モジュールのみ）。

## パイプラインの全体像

```
content/<book>/*.txt            一次ソース（本のプロンプト）
content/<book>/index.md         収録一覧（章・演習番号・ファイル対応）
        │  ①--scaffold で雛形化（index.mdを解析）
        ▼
content/<book>/manifest.json    グルーピング定義（束ね方＋メタデータ）★ここが真実の源
        │  ②build（本文を焼き込み）
        ▼
docs/data/exercises.json        サイトが読む最終データ
        │  ③validate
        ▼
        push → GitHub Pages 更新
```

## ① 雛形生成（新しい書籍を追加するとき）

```bash
node scripts/build-data.mjs --scaffold <bookId>
```

`content/<book>/index.md` を解析し、章・タイトル・ファイル対応を prefill した
`content/<book>/manifest.draft.json` を出力する。これを手で編集する：

- **多段演習の束ね**：複数の .txt を1演習にまとめる場合、その演習の `steps` に
  `sourceFile` を順番に並べる（例：ロールプレイの「設定＋フィードバック＋SV」、催眠の step1/2/3）。
- **メタデータの記入**：`promptRole`（client / evaluator / educator / guide / quizmaster / partner）、
  `mode`（normal / study）、`skillCategories`、`learningObjective`、`overview`、`safetyNotes`、`reflection`。

整え終えたら `manifest.draft.json` を `manifest.json` にリネームする。

> `difficulty` / `estimatedMinutes` / `tags` は当面 `null` / `[]` のままでよい（plan.md §4.4）。

## ② ビルド（exercises.json を生成）

```bash
node scripts/build-data.mjs
```

全書籍の `manifest.json` を集約し、各ステップの本文を焼き込んで `docs/data/exercises.json` を生成する。
`manifest.json` がまだ無い書籍はスキップされる。

## ③ 検証（push 前に必ず）

```bash
node scripts/validate-data.mjs
```

`exercises.json` の必須項目・enum値（promptRole / mode）・`bookId` 参照・`sourceFile` の実在・
本文の焼き込みをチェックする。エラーがあれば終了コード 1。

## 「半自動」の考え方

機械的にできること（index.md の解析・本文の取り込み・参照チェック）はスクリプトが担い、
編集判断が要ること（束ね方・役割・学習目標の記述）は人が `manifest.json` で行う。
束ね方は `manifest.json` にソースとして残るため、再ビルドしても失われない。

> `manifest.draft.json` と `exercises.draft.json` は `.gitignore` 対象（コミットしない）。
> コミットするのは整え終えた `manifest.json` と、生成物 `exercises.json`。
