# CLAUDE.md — このリポジトリで作業するエージェントへ

> このファイルは Claude Code が最初に自動で読み込む案内書です。まずここを読んでから作業してください。
> より詳しい企画・設計は `planning/plan.md`、運用手順は `README.md` と `scripts/README.md` にあります。

---

## 1. このプロジェクトは何か

著者（心理臨床家）の**4冊の書籍で紹介したAI演習プロンプト（計88演習）**を、大学院生・心理臨床の学習者向けに一元管理・配布する**静的Web教材サイト**。ChatGPT・Claude・Gemini などの生成AIを「演習の実行環境」として使うためのプロンプトを、教育的な文脈・順序・注意とともに提供する。

- API連携はしない。学習者は演習を選び、プロンプトをコピーして自分のAIに貼り付けて使う（コピー＆ペースト方式）。
- **公開URL:** https://satoshi-oga6101.github.io/psych-ai-training/
- **ホスティング:** GitHub Pages（`main` ブランチの `/docs` フォルダを配信）。`git push` すれば自動でサイト更新。

収録4冊（`books.json` の id / `content/` のフォルダ名）:

| 書籍 | id / sourceDir | 演習数 |
|---|---|---|
| AIと学ぶ心理臨床 | `ai-clinical-psychology` | 35 |
| カウンセリング技法独学AIワークブック | `counseling-techniques` | 25 |
| 心理面接はなぜ進むのか | `interview-process` | 7 |
| 心理臨床家のための臨床催眠入門（全3巻） | `clinical-hypnosis` | 21 |

---

## 2. ディレクトリ構造

```
psych-ai-training/
├── CLAUDE.md              ← このファイル
├── README.md              運用手順・収録状況
├── .gitignore
├── planning/              企画・設計ドキュメント（サイトには公開されない）
│   ├── plan.md            計画改訂版（最新の設計書。まず参照）
│   └── archive/plan-v1-初版.md
├── content/               一次ソース＝本のプロンプト（真実の源。サイト非公開）
│   ├── <book>/index.md        収録一覧（人間用の目次。scaffold の入力）
│   ├── <book>/manifest.json   ★グルーピング定義＋メタデータ（ここが編集対象）
│   ├── <book>/*.txt           プロンプト本文
│   └── FOLDER-MAP.md          日本語タイトル ↔ フォルダ名 対応表
├── scripts/
│   ├── build-data.mjs     content の manifest → docs/data/exercises.json 生成
│   └── validate-data.mjs  exercises.json の検証
└── docs/                  ← GitHub Pages で公開する静的サイト（ここだけWebに出る）
    ├── index.html / style.css / script.js   フレームワーク非依存の素のJS
    ├── assets/
    └── data/
        ├── books.json      書籍マスタ（手で管理）
        ├── ai-modes.json   AI・実行モードの参照テーブル（手で管理）
        └── exercises.json  ★生成物（手で編集しない。manifest から再生成する）
```

---

## 3. データパイプライン（最重要）

**`content/<book>/manifest.json` が真実の源。`docs/data/exercises.json` は生成物。**

```
content/<book>/index.md        （人間用の目次）
        │  ① node scripts/build-data.mjs --scaffold <bookId>  → manifest.draft.json（index.md解析でprefill）
        ▼
content/<book>/manifest.json   （グルーピング＋メタデータを人手で整える）★
        │  ② node scripts/build-data.mjs        → docs/data/exercises.json（本文を焼き込み）
        ▼
docs/data/exercises.json       （サイトが読む最終データ）
        │  ③ node scripts/validate-data.mjs     → 必須項目・enum・参照切れを検査
        ▼
        git add/commit/push → GitHub Pages 自動更新
```

### 鉄則

- **`docs/data/exercises.json` を直接手で編集しないこと。** 必ず `manifest.json` を直して `build-data.mjs` で再生成する。
- サイトが読むプロンプト本文は `exercises.json` に**焼き込まれている**（`content/` の .txt は Web配信されないため）。だから manifest 編集後は必ずリビルドが要る。
- **push 前に必ず `node scripts/validate-data.mjs` を通す。** エラーがあれば終了コード1。
- 依存パッケージなし（Node 16+ 標準モジュールのみ）。`npm install` 不要。

### 新しい演習・書籍を足す/直すとき

1. `content/<book>/` に .txt を置く/直す。
2. （新規書籍なら）`node scripts/build-data.mjs --scaffold <bookId>` で `manifest.draft.json` を作り、編集して `manifest.json` にリネーム。
3. `manifest.json` を編集（下の §4 スキーマに従う。多段演習の束ね・役割・モード等）。
4. `node scripts/build-data.mjs` → `node scripts/validate-data.mjs`。
5. commit & push。

---

## 4. データモデル / スキーマ

`manifest.json` の各 exercise（`build-data.mjs` がこれを exercises.json に展開し、`steps[].prompt` に本文を焼き込む）:

```jsonc
{
  "id": "counseling-techniques__6-1",   // 全書籍で一意。慣例: "<bookId>__<番号 or slug>"
  "chapter": "第6章　質問スキル（Questioning）",  // 巻・章。書籍軸ナビの見出しに使う
  "title": "AI演習 6-1　開かれた質問への言い換え",
  "skillCategories": ["質問スキル"],     // §4.1 の語彙から。スキル軸ナビ／フィルタに使う
  "exerciseType": [],                    // §4.1.1 の演習タイプ。該当演習にだけ付ける（大半は空）
  "promptRole": "evaluator",             // §4.2 の enum のいずれか
  "mode": "normal",                       // "normal" | "study"（演習の代表値）
  "template": false,                      // [ ] を学習者が埋めるテンプレートなら true
  "difficulty": null,                     // 予約フィールド。当面 null（§4.3）
  "learningObjective": "…",
  "overview": "…",
  "estimatedMinutes": null,               // 予約フィールド。当面 null
  "safetyNotes": ["…"],                   // 空配列可。臨床上の注意（架空事例・匿名化・安全確認 等）
  "reflection": ["…"],                    // 振り返りの問い
  "steps": [
    { "order": 1, "label": "① …", "sourceFile": "prompt_13.txt" },
    { "order": 2, "label": "② …", "sourceFile": "prompt_14.txt", "mode": "study" }  // step.mode は任意
  ],
  "tags": []                              // 予約フィールド。当面 空配列（§4.3）
}
```

### 4.1 skillCategories（スキル軸ナビの語彙・実データで確定済み）

自己理解・臨床家自身の作業 / ケースフォーミュレーション / 分解スキル / 応答スキル（リフレクション） / 観察スキル / ズレの弁別 / 質問スキル / 介入スキル / 状態・体験過程への働きかけ / 模擬クライエント・ロールプレイ / スーパービジョン・振り返り / 学術学習（理論理解・文献・論文） / 問いの設計（プロンプト設計） / 催眠技法 / 臨床判断・見立て / 倫理・守るべき一線

> 新カテゴリを足すと自動的にスキル軸ナビに現れる。安易に増やさず、既存に当てはまるか先に検討する。skillCategories は「何を練習するか（スキル）」の軸。「どういう形式の演習か」は §4.1.1 の exerciseType に分けた。

### 4.1.1 exerciseType（演習タイプ。skillCategories とは別軸のタグ）

「何を練習するか」ではなく「どういう形式の演習か」を表す。該当する演習にだけ付け、大半は空配列。UIでは絞り込み（左ペインの「演習タイプ」フィルタ。データに1件でもあれば自動表示）とバッジ（`badge--type`）に出る。skillCategories と同じく enum ではなく data 由来の自由語彙で、`build-data.mjs` が焼き込み、UIが出現順に収集する。現行の3タグ:

- **統合トレーニング**（カウンセリング 8-1〜8-3。通しの面接）
- **典型的な失敗パターン**（カウンセリング 9-1・9-2）
- **クライエント側に立つ体験**（学習者自身が体験・探索される側に立つ。自己理解4件＋催眠 III-2B-1／I-2-1／II-3-1 の計7件）

> 以前は「統合トレーニング」「典型的な失敗パターン」を skillCategories に混ぜていたが、スキル軸が濁るため exerciseType に移した。移動に伴い 9-1・9-2 には実スキルとして「ズレの弁別」を付与（空になるのを防ぐため。編集判断なので必要なら見直す）。

### 4.2 promptRole（AIが担う役割・enum。UIにラベルとフィルタあり）

| 値 | 意味（UIラベル） |
|---|---|
| `client` | AIが模擬クライエントを演じる（模擬クライエント） |
| `evaluator` | AIが応答を採点・FB（採点・FB） |
| `educator` | AIが教育者・SVとして解説・助言（教育者・SV） |
| `guide` | AIが学習モード等で理解・体験を導く（ガイド） |
| `quizmaster` | AIが出題者として課題を出す（出題者） |
| `partner` | AIが壁打ち相手・添削者（壁打ち・添削） |

`validate-data.mjs` がこの enum を検査する。値を増やす場合は validate と `docs/script.js` の `ROLE_LABELS` / `ROLE_DESC` も更新する。

### 4.3 予約フィールド（difficulty / estimatedMinutes / tags）

決定基準が難しいため、スキーマ上は用意するが**当面は値を入れない**（`null` / `[]`）。UIは未設定なら対応バッジ・フィルタを出さない実装。基準が固まった演習から順次付与する。詳細は `planning/plan.md` §4.4。

### 4.4 実行モードはステップ単位でも指定できる

`mode` は exercise レベルが代表値。step に `mode` があればそのステップはそちらが優先される（例：臨床催眠 `clinical-hypnosis__I-2-1` は前半 normal・③のみ study）。UIは混在時に「モード混在」バッジと、ステップごとの貼り付け先案内を表示する。

---

## 5. サイト（docs/）の作り

- **フレームワーク非依存の素のJS**（`docs/script.js`）。ビルド工程なし。`books.json` / `ai-modes.json` / `exercises.json` を `fetch` で読んで描画する。
- **ブラウザストレージ（localStorage 等）は使わない。** 状態はメモリ上のみ。ただしURLハッシュは共有用に使う（ディープリンク。下記）。
- 主な機能: 二軸ナビ（書籍で探す／スキルで探す）、フィルタ（AIの役割・実行モード・キーワード）、書籍→章のグループ見出し、演習詳細（出所・ねらい・概要・注意・AI選択・ステップ別コピー・振り返り）、テンプレート/モード混在バッジ。
- **ローカル確認は `file://` 不可**（fetchがCORSで失敗する）。`cd docs && python3 -m http.server 8000` でサーバー経由で開く。
- `ai-modes.json` の各AIの学習モード名（Study / Learning Style / Guided Learning）は変わり得る。**名称はこのファイルだけで更新**し、UI・データ側は触らない。
- **使い方ガイド**は初回表示時と「使い方」ボタンで詳細ペインに出る（`renderGuide()`）。文言は `script.js` 内に直書き。
- **書籍のAmazonリンクは `books.json` の `volumes[]` で管理する。** 1冊の書籍も `volumes` は要素1つの配列（`label: null`）で持ち、全3巻の臨床催眠だけ3要素になる。UIは1つのコード経路（`bookLinksHTML()`）で両方を描く。リンクは Kindle版・紙版を併記し、演習一覧の書籍見出しと使い方ガイドの「収録書籍」の2か所に出る。巻をまたぐ配布物（臨床催眠の合本PDF版など）は書籍レベルの `downloads[]` に置き、巻ごとのリンクと混ざらないよう改行して表示する。
- **著者名・note のURLは `script.js` 冒頭の `AUTHOR` 定数**が唯一の定義箇所。変わったらここだけ直す。
- **ディープリンク**：URLハッシュ＝演習ID（例 `…/#counseling-techniques__6-1`）。読み込み時にハッシュがあればその演習を開き、無効／無ければ使い方ガイド。演習を選ぶと `history.replaceState` でハッシュを更新（履歴は汚さない）、`hashchange` で外部リンク・戻る・手入力に追従する。詳細ヘッダの「リンクをコピー」ボタンは `shareUrl()`（origin+pathname+search+#id）をコピー。中心は `openExercise()` / `openExerciseById()`。ブラウザストレージ不使用の方針は維持（ハッシュはURLの一部でストレージではない）。
- 書名は Amazon の表記に合わせている（例：「カウンセリング技法**独学AI**ワークブック」。語順に注意）。`subtitle` はガイドの収録書籍一覧にだけ表示され、ナビ・見出しは `title` を使う。

---

## 6. これまでの主要な決定事項（踏襲すること）

- 一次ソースのフォルダ名はローマ字（ASCII）。対応表は `content/FOLDER-MAP.md`。
- GitHub Pages は `/docs` 公開方式。サイトは `docs/` 配下、企画資料は `planning/`、元データは `content/`。
- プロンプト本文はAI共通で1本（ChatGPT/Claude/Gemini別に複製しない）。AIごとの違いは「モードと貼り付け先」だけ。
- 多段演習のグルーピング例（editorial。変えたい時は manifest を直す）:
  - カウンセリング `6-1` = prompt_13 + prompt_14（閉→開／なぜ回避）を1演習2ステップ。
  - 心理臨床 結衣初回面接 = prompt_08（設定）+ prompt_09（面接中の軌道修正）を1演習2ステップ。面接後の prompt_12（FB）・prompt_13（逐語SV）は「どのロールプレイでも使える」独立演習として切り出し。
  - 臨床催眠 `I-2-1`（3ステップ・モード混在）、`I-5-2`（2ステップ・モード混在）。
- 臨床倫理: すべて架空事例。実クライエント情報は入力しない。実在事例を扱う演習は匿名化を促す `safetyNotes` を付ける。催眠のイメージ誘導（内なるファンタジーの旅）は安全確認・帰還フレーズを省略せず提示する。
- カウンセリング `index.md` の採番ずれ（旧prompt_22削除に伴う）は修正済み。`index.md` は人間用の目次／scaffold入力であり、正は `manifest.json`。

---

## 7. gitと公開の運用

- リポジトリはローカルの Mac 上で管理（GitHub Pages `/docs` 公開、`main` ブランチ）。
- 変更フロー: `content` か `docs` を編集 → `build-data.mjs` → `validate-data.mjs` → `git add -A` → `git commit` → `git push` → Pages 自動更新。
- `.gitignore` 済み: `.DS_Store` / `docs/data/exercises.draft.json` / `content/*/manifest.draft.json` / `node_modules` / **`planning/`**。ドラフトはコミットしない。
- **このリポジトリは GitHub 上で public。** `planning/` の企画資料・記事の下書きは公開したくないため git 管理から外し、ローカルにのみ置く（ファイル自体は残るので参照はできる）。新しく資料を足すときも `planning/` の中に置けば自動で除外される。
- **コミットの著者情報はグローバル設定（`Satoshi Oga` / GitHub の noreply アドレス）を使う。** 以前はこのリポジトリのローカル設定が別名・個人アドレスを上書きしていたため、履歴を書き換えて統一した。`git config --local user.email` を設定し直さないこと。
- 注意: 過去にクラウド環境から git 初期化した名残でロックファイル等が残る場合がある。ローカルの Mac では通常の git で問題なく扱える。

---

## 8. 未着手・次にやれること（優先度順ではない）

- 匿名の利用ログ（訪問数・コピー回数・選択AI/モード等。個人は識別しない。`planning/plan.md` §12/§13）。
- 難易度・想定時間・タグの付与（基準が固まってから。§4.3）。
- スキルカテゴリの最終整理（「統合トレーニング」等を演習タイプ軸に分けるか）。

作業前に `planning/plan.md`（設計思想と積み残し §15）に目を通すと文脈が掴める。
