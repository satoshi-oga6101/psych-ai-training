# psych-ai-training

著者の4冊の書籍で紹介したAI演習プロンプトを、大学院生・心理臨床の学習者向けに一元管理・配布する **静的Web教材サイト** のリポジトリ。ChatGPT・Claude・Gemini などの生成AIを「演習の実行環境」として使うためのプロンプトを、教育的な文脈・順序・注意事項とともに提供する。

企画の全体像は [`planning/plan.md`](planning/plan.md) を参照。

---

## ディレクトリ構造

```
psych-ai-training/
├── README.md              ← このファイル
├── .gitignore
│
├── planning/              企画・設計ドキュメント（サイトには公開されない）
│   ├── plan.md            計画改訂版（最新の設計書）
│   └── archive/
│       └── plan-v1-初版.md
│
├── content/               一次ソース＝本のプロンプト（真実の源。サイトには公開されない）
│   ├── ai-clinical-psychology/   AIと学ぶ心理臨床
│   ├── counseling-techniques/    カウンセリング技法独学AIワークブック
│   ├── interview-process/        心理面接はなぜ進むのか
│   ├── clinical-hypnosis/        心理臨床家のための臨床催眠入門（全3巻）
│   └── FOLDER-MAP.md             日本語タイトル ↔ フォルダ名 対応表
│
├── scripts/               content → docs/data への変換ツール
│   ├── build-data.mjs     txt群を読み、雛形JSON（ドラフト）を生成する
│   └── README.md
│
└── docs/                  ← GitHub Pages で公開する静的サイト（ここだけがWebに出る）
    ├── index.html
    ├── style.css
    ├── script.js
    ├── assets/
    └── data/              サイトが読み込むJSON（プロンプト本文はここに焼き込む）
        ├── books.json      書籍マスタ（手で管理）
        ├── ai-modes.json   AI・実行モードの参照テーブル（手で管理）
        └── exercises.json  演習データ（ドラフトを人手で整えた最終版）
```

### なぜ `content/` と `docs/` を分けるのか

GitHub Pages は「配信する場所」を1か所だけ指定する仕組みで、本リポジトリでは `docs/` を指定する。つまり **Webに出るのは `docs/` の中身だけ**で、`content/`（元プロンプト）や `planning/`（企画書）はリポジトリには入るがサイトとしては配信されない。

この分離のため、サイトが実際に読むプロンプト本文は `docs/data/exercises.json` に**焼き込む**必要がある（`content/` の .txt はWebからはアクセスできないためJSONに取り込む）。この焼き込みを行うのが `scripts/build-data.mjs`。

---

## 教材を追加・更新する流れ

各書籍フォルダの `manifest.json`（グルーピング定義）が「真実の源」で、そこから `docs/data/exercises.json` を生成する。

1. `content/<書籍>/` に元プロンプト（.txt）を置く／編集する。
2. `node scripts/build-data.mjs --scaffold <bookId>` で `manifest.draft.json`（章・タイトルを index.md から prefill）を生成する。
3. ドラフトを編集して多段演習を束ね、役割・モード・学習目標などを記入し、`manifest.json` にリネームする。
4. `node scripts/build-data.mjs` で `docs/data/exercises.json` を生成（本文を焼き込み）。
5. `node scripts/validate-data.mjs` で検証（必須項目・enum・参照切れ）。
6. Git に push すると GitHub Pages が自動でサイトを更新する。

手順の詳細は [`scripts/README.md`](scripts/README.md) を参照。

> 難易度・想定時間・タグは当面は空（`null` / `[]`）で運用する（詳細は `planning/plan.md` §4.4）。

### 収録状況（88演習・全4冊 完了）

- ✅ AIと学ぶ心理臨床 … 35演習（結衣ロールプレイは設定＋軌道修正を2ステップに束ね。テンプレート型を22件マーク）
- ✅ カウンセリング技法独学AIワークブック … 25演習
- ✅ 心理面接はなぜ進むのか … 7演習（状態・体験過程への言語的働きかけのロールプレイ）
- ✅ 心理臨床家のための臨床催眠入門（全3巻）… 21演習（Studyモード中心・ガイド役。AI-I-2-1／AI-I-5-2 はステップごとに通常型とStudyモードが混在）

> **ステップ別モード:** 各 step は任意で `mode`（normal / study）を持てる。演習の `mode` は代表値で、ステップに `mode` があればそれが優先される。サイトは混在時に「モード混在」バッジとステップ別の貼り付け先案内を表示する。

> 各演習は `template`（真偽値）を持つ。`true` はプロンプト内の `[ ]` を学習者が自分の内容に置き換えて使うテンプレート。サイトはバッジと注記で表示する。

---

## ローカルでの確認

`docs/data/*.json` を `fetch` で読むため、`file://` 直開きではなくローカルサーバー経由で確認する。

```bash
cd docs && python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

## 公開（GitHub Pages）

リポジトリの Settings → Pages で、Source を「Deploy from a branch」、Branch を `main` / フォルダを `/docs` に設定する。以降は push するだけでサイトが更新される。
