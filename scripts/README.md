# scripts

## build-data.mjs

一次ソース（`content/`）の .txt から、演習データの**雛形（ドラフト）**を生成する。

```bash
node scripts/build-data.mjs
```

- 入力：`content/<書籍>/*.txt` と `docs/data/books.json`
- 出力：`docs/data/exercises.draft.json`（1ファイル＝1ドラフト演習。プロンプト本文を焼き込み済み）

### 「半自動」の考え方

このスクリプトは**機械的にできる部分だけ**を担当する（ファイル列挙・本文の取り込み・IDの付与）。以下は編集判断が要るため人手で行う：

- 多段演習のグルーピング（例：ロールプレイの「設定＋フィードバック＋SV」を1演習に束ねる。`steps` に複数の `sourceFile` を並べる）
- `title` / `chapter` / `promptRole` / `mode` / `skillCategories` / `learningObjective` / `overview` / `safetyNotes` / `reflection` の記入

ドラフトから該当エントリを `docs/data/exercises.json`（最終版）へ移し、上記を整える。`_preview` フィールドは作業用の目印なので最終版では削除してよい。

> `exercises.draft.json` は `.gitignore` 対象（コミットしない）。コミットするのは整え終えた `exercises.json` のみ。
