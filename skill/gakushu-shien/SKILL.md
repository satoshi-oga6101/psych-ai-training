---
name: gakushu-shien
description: 臨床心理・カウンセリング・催眠技法の学習用プロンプト集(全88本・4書籍)。ユーザーが心理臨床スキルの練習・学習、模擬クライエントとのロールプレイ、リフレクション・質問技法・催眠誘導文などの技法練習を求めた際に使う。該当する演習をclient/guide/evaluator等の役割になりきって進行する。
---

# 学習支援スキル（gakushu-shien）

## このSkillについて

このSkillは、臨床心理・カウンセリング・催眠技法を学ぶための練習プロンプト集
(`exercises.json`、全88本)を教材として使い、ユーザーが学びたいテーマに
合った1本を選び出し、その演習を実際に進行するためのものです。

収録データは4冊の書籍に対応しています。

| bookId | 内容の傾向 | 件数 |
|---|---|---|
| ai-clinical-psychology | AIを使った自己理解・ケースフォーミュレーション・模擬面接 | 35 |
| counseling-techniques | カウンセリング技法（分解・リフレクション・観察・質問・介入） | 25 |
| interview-process | 面接プロセス（状態・体験過程への働きかけ） | 7 |
| clinical-hypnosis | 催眠技法（誘導文・暗示・スクリプト作成練習） | 21 |

## データの読み方

`exercises.json`は88件の配列で、各要素は次の構造を持ちます。
このファイル自体は読み取り専用の参照データであり、実行中に書き換える必要はありません。

- `id`：一意の識別子（例: `ai-clinical-psychology__jibunshi`）
- `bookId` / `chapter` / `title`：所属書籍・章・タイトル
- `skillCategories` / `exerciseType` / `tags`：分類・検索用のラベル
- `promptRole`：この演習でClaudeが担うべき役割（下記参照）
- `mode`：`normal`（通常のチャットとして進行）または `study`（学習・練習モードとして進行。ヒントを小出しにする、正解や模範解答を先に明かさない、必要に応じて途中で理解度を確認するなど、教える・練習させることに重心を置いた進め方を意識する）
- `learningObjective` / `overview`：この演習のねらいと概要
- `steps`：実行手順の配列。各要素は`order`（順番）と`prompt`（実際に使う指示文）を持つ。ほとんどは1ステップだが、2〜3ステップの演習も存在する
- `reflection`：演習後にユーザーへ投げかける振り返りの問い（配列）
- `safetyNotes`：配慮すべき注意事項（空配列のことも多い）

### promptRoleの意味

| promptRole | Claudeが担う役割 |
|---|---|
| client | 模擬クライエント役を演じ、ユーザー（臨床家役）に練習させる |
| guide | ユーザーを導く進行役になる（催眠誘導文・スクリプト作成の練習など） |
| evaluator | ユーザーの応答・記述を評価する |
| partner | 対等な探索の伴走者になる（例：自分史の振り返り、逸話への応答） |
| educator | 知識・技法を教える講師役になる |
| quizmaster | クイズ形式で出題する |

## 動作フロー

### 1. テーマの特定

ユーザーの発言（例：「催眠の誘導文を練習したい」「模擬クライエントと面接練習をしたい」）から、
下記の目次と照合し、該当しそうな演習を絞り込む。絞り込みは次の優先順位で行う。

1. idが明示されている（前回の続きなど） → そのまま使う
2. タイトルと発言が一致・強く対応する → 確定
3. `skill:`（skillCategories）と発言のテーマが一致する → 候補を絞る
4. `type:`（exerciseType）と発言の求める形式が一致する → 候補を絞る
   （例：「クライエントの側を体験したい」→ `クライエント側に立つ体験`、
   「通しで面接をやりたい」→ `統合トレーニング`、
   「よくある失敗を知りたい」→ `典型的な失敗パターン`）
5. 章・書籍のテーマから推測する → 候補を絞る

複数の優先順位を経ても候補が複数残る、または曖昧な場合は、どれを指しているか
ユーザーに確認してから進める。目次にないテーマを求められた場合は、無理に近い
ものを選ばず、収録範囲外であることを伝える。

なお`tags`フィールドは全88件で空のため、現時点では絞り込みに使えない
（将来、演習追加時にtagsが埋まれば優先順位に組み込む）。

### 2. 該当レコードの取得

idが確定したら、`scripts/get_exercise.py`でその1件だけの完全なデータ（steps・
reflection・safetyNotes込み）を取得する。

```bash
python3 scripts/get_exercise.py <id>
```

idを誤って指定した場合、このスクリプトは近い候補を提示するので、それを参考に
再実行する。

### 3. 演習の実行

- `promptRole`を確認し、対応する役割になりきって会話を進める（上表参照）
- `mode`が`study`の場合は、教える・練習させることに重心を置いた進め方を意識する
- `steps`が複数ある場合は、`order`の順に1つずつ進める
- 各stepの`prompt`の内容が、その時点でClaudeが実際にユーザーへ投げかける・
  実行する指示そのものになる

### 4. 演習後

- 一区切りついたら、`reflection`に列挙された問いをユーザーへ投げかける
- `safetyNotes`が空でない場合は、そこに書かれた配慮事項を踏まえて振る舞う
  （例：心理的に踏み込みすぎない、模擬であることを見失わない、等）

## 目次

以下の目次と、ユーザーの発言内容を照合してidを特定する。表記は
`[id] 章 / タイトル (role: 役割, skill: 分類, type: 演習タイプ) [learning]`の形式。
`skill:`は`skillCategories`（技能分類。本の章立てより、ユーザーが「リフレクションを
練習したい」のように技能ベースで話すケースと相性が良い）。`type:`は`exerciseType`
（演習の形式。該当する演習にだけ付くので、大半の行には出てこない）。`[learning]`が
付いているものは`mode: study`（学習・練習モード推奨）の演習。

<!-- INDEX:START 自動生成。build-data.mjs が書き換えるので手で編集しない -->

#### ai-clinical-psychology

- [ai-clinical-psychology__jibunshi] 第2章　自己を知る作業にAIを使う / 自分史と「転機」の探索 (role: partner, skill: 自己理解・臨床家自身の作業, type: クライエント側に立つ体験)
- [ai-clinical-psychology__kazokureki] 第2章　自己を知る作業にAIを使う / 家族歴の探索 (role: partner, skill: 自己理解・臨床家自身の作業, type: クライエント側に立つ体験)
- [ai-clinical-psychology__kazoku-rikigaku] 第2章　自己を知る作業にAIを使う / 育った家族の力学の探索 (role: partner, skill: 自己理解・臨床家自身の作業, type: クライエント側に立つ体験)
- [ai-clinical-psychology__taijin-pattern] 第2章　自己を知る作業にAIを使う / 対人パターンの見立て (role: partner, skill: 自己理解・臨床家自身の作業, type: クライエント側に立つ体験)
- [ai-clinical-psychology__formulation-3theory] 第3章　AIと心理臨床スキルを磨く / 複数理論でのケースフォーミュレーション (role: educator, skill: ケースフォーミュレーション)
- [ai-clinical-psychology__formulation-cbt-feedback] 第3章　AIと心理臨床スキルを磨く / CBTフォーミュレーションへのフィードバック (role: educator, skill: ケースフォーミュレーション)
- [ai-clinical-psychology__formulation-sv-socratic] 第3章　AIと心理臨床スキルを磨く / 問いに導かれるフォーミュレーション（SV型） (role: educator, skill: ケースフォーミュレーション/スーパービジョン・振り返り)
- [ai-clinical-psychology__roleplay-yui-intake] 第3章　AIと心理臨床スキルを磨く / 模擬クライエント結衣・初回面接ロールプレイ (role: client, skill: 模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__roleplay-yui-orientation] 第3章　AIと心理臨床スキルを磨く / 結衣ロールプレイ・オリエンテーション（枠と守秘の説明） (role: client, skill: 模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__roleplay-yui-contract] 第3章　AIと心理臨床スキルを磨く / 結衣ロールプレイ・治療契約 (role: client, skill: 模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__roleplay-feedback] 第3章　AIと心理臨床スキルを磨く / 面接後のフィードバックを受ける (role: evaluator, skill: スーパービジョン・振り返り/模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__transcript-sv] 第3章　AIと心理臨床スキルを磨く / 逐語録のスーパーバイズ (role: educator, skill: スーパービジョン・振り返り)
- [ai-clinical-psychology__roleplay-yui-psychoeducation] 第3章　AIと心理臨床スキルを磨く / 結衣ロールプレイ・心理教育 (role: client, skill: 模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__explain-understanding] 第4章　学術的学習にAIを使う / 理論を自分の言葉で説明してフィードバックを受ける (role: partner, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-discriminating] 第4章　学術的学習にAIを使う / 理解と暗記を見分けるクイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__paper-explain] 第4章　学術的学習にAIを使う / 論文の難所を理論的文脈で理解する (role: educator, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__literature-shared-views] 第4章　学術的学習にAIを使う / 文献群から共有された見方を把握する (role: educator, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__literature-consensus-map] 第4章　学術的学習にAIを使う / 文献の合意マップ（レビュー準備） (role: educator, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__paper-structure-feedback] 第4章　学術的学習にAIを使う / 論文構成案へのフィードバック (role: partner, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__paper-passage-feedback] 第4章　学術的学習にAIを使う / 論文の一段落へのコメント (role: partner, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-plain-words] 第4章　学術的学習にAIを使う / 用語を日常語で説明するクイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-case-application] 第4章　学術的学習にAIを使う / 事例応用クイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-compare-theories] 第4章　学術的学習にAIを使う / 2つの理論を比較するクイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-error-detection] 第4章　学術的学習にAIを使う / 誤りを見抜くクイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-critiques] 第4章　学術的学習にAIを使う / 批判に応答するクイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__quiz-structure] 第4章　学術的学習にAIを使う / 構造理解クイズ (role: quizmaster, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__answer-diagnosis] 第4章　学術的学習にAIを使う / 自分の誤答を診断して弱点を補強する (role: educator, skill: 学術学習（理論理解・文献・論文）)
- [ai-clinical-psychology__practicum-reflection] 第5章　守るべき一線 / 実習の振り返り（自分の反応から考える） (role: partner, skill: 倫理・守るべき一線/スーパービジョン・振り返り)
- [ai-clinical-psychology__formulation-cbt-template] 第6章　自分の問いを設計する / フォーミュレーション依頼の型（問い設計の例） (role: educator, skill: ケースフォーミュレーション/問いの設計（プロンプト設計）)
- [ai-clinical-psychology__roleplay-mi-basic] 第6章　自分の問いを設計する / 動機づけ面接（MI）ロールプレイ・基本 (role: client, skill: 模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__roleplay-mi-rules] 第6章　自分の問いを設計する / 動機づけ面接（MI）ロールプレイ・厳密ルール版 (role: client, skill: 模擬クライエント・ロールプレイ)
- [ai-clinical-psychology__roleplay-template-approach] 第6章　自分の問いを設計する / ロールプレイのテンプレート（アプローチ別） (role: client, skill: 模擬クライエント・ロールプレイ/問いの設計（プロンプト設計）)
- [ai-clinical-psychology__roleplay-template-generic] 第6章　自分の問いを設計する / ロールプレイのテンプレート（汎用） (role: client, skill: 模擬クライエント・ロールプレイ/問いの設計（プロンプト設計）)
- [ai-clinical-psychology__explain-understanding-template] 第6章　自分の問いを設計する / 理解の説明とフィードバックの型（汎用） (role: partner, skill: 学術学習（理論理解・文献・論文）/問いの設計（プロンプト設計）)
- [ai-clinical-psychology__prompt-reflection] 第6章　自分の問いを設計する / プロンプトの振り返り（意図と応答のズレを直す） (role: partner, skill: 問いの設計（プロンプト設計）)

#### counseling-techniques

- [counseling-techniques__2-1] 第2章　分解スキルの習得 / AI演習 2-1　出来事と考えを分ける (role: evaluator, skill: 分解スキル)
- [counseling-techniques__2-2] 第2章　分解スキルの習得 / AI演習 2-2　気持ちと願望を分ける (role: evaluator, skill: 分解スキル)
- [counseling-techniques__2-3] 第2章　分解スキルの習得 / AI演習 2-3　4要素に分ける (role: evaluator, skill: 分解スキル)
- [counseling-techniques__3-1] 第3章　応答スキル：リフレクション（Reflecting） / AI演習 3-1　単一要素のリフレクション (role: evaluator, skill: 応答スキル（リフレクション）)
- [counseling-techniques__3-2] 第3章　応答スキル：リフレクション（Reflecting） / AI演習 3-2　2要素を組み合わせたリフレクション (role: evaluator, skill: 応答スキル（リフレクション）)
- [counseling-techniques__3-3] 第3章　応答スキル：リフレクション（Reflecting） / AI演習 3-3　アンビバレンスの反映 (role: evaluator, skill: 応答スキル（リフレクション）)
- [counseling-techniques__3-4] 第3章　応答スキル：リフレクション（Reflecting） / AI演習 3-4　わかりにくい発話への聞き返し (role: evaluator, skill: 応答スキル（リフレクション）)
- [counseling-techniques__4-1] 第4章　観察スキル（Observing） / AI演習 4-1　観察と解釈を分ける (role: evaluator, skill: 観察スキル)
- [counseling-techniques__4-2] 第4章　観察スキル（Observing） / AI演習 4-2　内の観察（身体感覚・感情・衝動） (role: evaluator, skill: 観察スキル)
- [counseling-techniques__4-3] 第4章　観察スキル（Observing） / AI演習 4-3　外と内を統合した観察 (role: evaluator, skill: 観察スキル)
- [counseling-techniques__5-1] 第5章　ズレに気づく / AI演習 5-1　ズレの検出（基礎） (role: evaluator, skill: ズレの弁別/観察スキル)
- [counseling-techniques__5-2] 第5章　ズレに気づく / AI演習 5-2　複数のズレの検出と関係分析 (role: evaluator, skill: ズレの弁別/観察スキル)
- [counseling-techniques__6-1] 第6章　質問スキル（Questioning） / AI演習 6-1　開かれた質問への言い換え (role: evaluator, skill: 質問スキル)
- [counseling-techniques__6-2] 第6章　質問スキル（Questioning） / AI演習 6-2　花あてゲーム (role: quizmaster, skill: 質問スキル)
- [counseling-techniques__6-3] 第6章　質問スキル（Questioning） / AI演習 6-3　要約 (role: evaluator, skill: 質問スキル/応答スキル（リフレクション）)
- [counseling-techniques__6-4] 第6章　質問スキル（Questioning） / AI演習 6-4　要素指定の質問とシークエンス (role: evaluator, skill: 質問スキル)
- [counseling-techniques__6-5] 第6章　質問スキル（Questioning） / AI演習 6-5　質問だけの面接ロールプレイ (role: client, skill: 質問スキル/模擬クライエント・ロールプレイ)
- [counseling-techniques__7-1] 第7章　介入スキル（Intervention） / AI演習 7-1　介入の順序と許可 (role: client, skill: 介入スキル/模擬クライエント・ロールプレイ)
- [counseling-techniques__7-2] 第7章　介入スキル（Intervention） / AI演習 7-2　枠を超える要求へのアサーション (role: client, skill: 介入スキル/模擬クライエント・ロールプレイ)
- [counseling-techniques__7-3] 第7章　介入スキル（Intervention） / AI演習 7-3　個人的な問いかけへの応答 (role: client, skill: 介入スキル/模擬クライエント・ロールプレイ)
- [counseling-techniques__8-1] 第8章　統合トレーニング（Deliberate Practice） / AI演習 8-1　通しの面接①（転職・孤立） (role: client, skill: 模擬クライエント・ロールプレイ, type: 統合トレーニング)
- [counseling-techniques__8-2] 第8章　統合トレーニング（Deliberate Practice） / AI演習 8-2　通しの面接②（子育てと自分の時間） (role: client, skill: 模擬クライエント・ロールプレイ, type: 統合トレーニング)
- [counseling-techniques__8-3] 第8章　統合トレーニング（Deliberate Practice） / AI演習 8-3　通しの面接③（沈黙・不本意な来談） (role: client, skill: 模擬クライエント・ロールプレイ, type: 統合トレーニング)
- [counseling-techniques__9-1] 補章　典型的な失敗パターン（Common Errors） / AI演習 9-1　ずれた応答の分析と修正 (role: evaluator, skill: ズレの弁別, type: 典型的な失敗パターン)
- [counseling-techniques__9-2] 補章　典型的な失敗パターン（Common Errors） / AI演習 9-2　9つの失敗パターンの判定 (role: evaluator, skill: ズレの弁別, type: 典型的な失敗パターン)

#### interview-process

- [interview-process__2-1] 第2章　この本で言う「状態」と「体験過程」 / AI演習 2-1　状態の変化を観察する (role: client, skill: 観察スキル/状態・体験過程への働きかけ/模擬クライエント・ロールプレイ)
- [interview-process__4-1] 第4章　注意を方向づける言語の実際【実践】 / AI演習 4-1　注意を方向づける (role: client, skill: 状態・体験過程への働きかけ/模擬クライエント・ロールプレイ)
- [interview-process__4-2] 第4章　注意を方向づける言語の実際【実践】 / AI演習 4-2　からだ言葉を拾い返す (role: client, skill: 状態・体験過程への働きかけ/模擬クライエント・ロールプレイ/応答スキル（リフレクション）)
- [interview-process__6-1] 第6章　覚醒を調整する言語の実際【実践】 / AI演習 6-1　覚醒を調整する (role: client, skill: 状態・体験過程への働きかけ/模擬クライエント・ロールプレイ)
- [interview-process__8-1] 第8章　ポジションを動かす言語の実際【実践】 / AI演習 8-1　ポジションを動かす (role: client, skill: 状態・体験過程への働きかけ/模擬クライエント・ロールプレイ/質問スキル)
- [interview-process__10-1] 第10章　イメージを立ち上げる言語の実際【実践】 / AI演習 10-1　イメージを立ち上げる (role: client, skill: 状態・体験過程への働きかけ/模擬クライエント・ロールプレイ/応答スキル（リフレクション）)
- [interview-process__11-1] 第11章　関係を言語にする / AI演習 11-1　関係の瞬間を観察しプロセスコメントを試みる (role: quizmaster, skill: 観察スキル/状態・体験過程への働きかけ/介入スキル)

#### clinical-hypnosis

- [clinical-hypnosis__I-2-1] 第1巻　コラム　AI演習のはじめかた / AI-I-2-1　催眠現象の四カテゴリを自分と学派に重ねる (role: guide, skill: 催眠技法, type: クライエント側に立つ体験)
- [clinical-hypnosis__I-5-1] 第1巻　第5章　プレインダクショントーク / AI-I-5-1　不安・誤解への応答練習 (role: guide, skill: 催眠技法/模擬クライエント・ロールプレイ) [learning]
- [clinical-hypnosis__I-5-2] 第1巻　第5章　プレインダクショントーク / AI-I-5-2　継続面接での催眠提案の学習とロールプレイ (role: guide, skill: 催眠技法/模擬クライエント・ロールプレイ)
- [clinical-hypnosis__I-6-1] 第1巻　第6章　覚醒法 / AI-I-6-1　覚醒法スクリプトの打ち込みと添削 (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__I-7-1] 第1巻　第7章　観察とペーシング / AI-I-7-1　ペーシング文の作成練習 (role: guide, skill: 催眠技法/応答スキル（リフレクション）) [learning]
- [clinical-hypnosis__I-8-1] 第1巻　第8章　リーディング / AI-I-8-1　リーディング文の作成練習 (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__I-9-1] 第1巻　第9章　つなぎの言葉と段階的リラクセーション誘導 / AI-I-9-1　つなぎの言葉の体系的学習と作成練習 (role: guide, skill: 催眠技法) [learning]
- [clinical-hypnosis__I-11-1] 第1巻　第11章　深化法 / AI-I-11-1　深化法の誘導文作成練習 (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__II-1-1] 第2巻　第1章A　分離のエクササイズ（基礎） / AI-II-1-1　意識と無意識を分けて語る構文 (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__II-1-2] 第2巻　第1章B　分離のエクササイズ（応用） / AI-II-1-2　対を交差させる構文（二重乖離） (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__II-1-3] 第2巻　第1章C　分離のエクササイズ（治療的体験） / AI-II-1-3　分離構文を作るときの自分の癖を見つける (role: guide, skill: 催眠技法/状態・体験過程への働きかけ/スーパービジョン・振り返り) [learning]
- [clinical-hypnosis__II-1-4] 第2巻　第1章C　コラム　イメージ誘導系のバリエーション / AI-II-1-4　イメージ誘導スクリプトの創作練習 (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__II-3-1] 第2巻　第3章　治療的な暗示とメタファーの活用 / AI-II-3-1　逸話だけ返すAIと遊ぶ (role: partner, skill: 催眠技法, type: クライエント側に立つ体験)
- [clinical-hypnosis__II-3-2] 第2巻　第3章　治療的な暗示とメタファーの活用 / AI-II-3-2　暗示設計の段階的練習 (role: guide, skill: 催眠技法/介入スキル) [learning]
- [clinical-hypnosis__II-5-1] 第2巻　第5章　臨床判断の枠組み / AI-II-5-1　AIに作ってもらった事例で弁別を練習する (role: guide, skill: 催眠技法/臨床判断・見立て) [learning]
- [clinical-hypnosis__II-7] 第2巻　第7章　エリクソン・モデルの特徴（コラム） / AI-II-7　インコーポレーションの誘導文作成練習 (role: guide, skill: 催眠技法/観察スキル) [learning]
- [clinical-hypnosis__III-1A-1] 第3巻　第1章A　自我強化法 / AI-III-1A-1　自我強化のためのメタファー作成 (role: guide, skill: 催眠技法/介入スキル) [learning]
- [clinical-hypnosis__III-2A-1] 第3巻　第2章A　知覚変容と象徴変換 / AI-III-2A-1　シンボル変換スクリプトの組み立て (role: guide, skill: 催眠技法/状態・体験過程への働きかけ) [learning]
- [clinical-hypnosis__III-2B-1] 第3巻　第2章B　内なるファンタジーの旅 / AI-III-2B-1　内なるファンタジーの旅 (role: guide, skill: 催眠技法, type: クライエント側に立つ体験)
- [clinical-hypnosis__III-4B-1] 第3巻　第4章B　通しのエクササイズとAI演習 / AI-III-4B-1　介入の方向を組み立てる (role: guide, skill: 催眠技法/介入スキル) [learning]
- [clinical-hypnosis__III-4B-2] 第3巻　第4章B　通しのエクササイズとAI演習 / AI-III-4B-2　包括的な後催眠暗示の構造 (role: guide, skill: 催眠技法/介入スキル) [learning]
<!-- INDEX:END -->

## このSkillの保守について

**`exercises.json`と上記の目次は、このフォルダで直接編集しない。** どちらも
psych-ai-training リポジトリの `content/<book>/manifest.json` から生成される
派生物であり、手で直しても次のリビルドで上書きされる。

演習を追加・修正するときは、リポジトリ側で manifest を直してリビルドする。

```bash
node scripts/build-data.mjs     # サイトとこのSkillの両方を更新する
node scripts/validate-data.mjs  # データ検査（Skill側との一致も見る）
```

これで `docs/data/exercises.json`・`skill/gakushu-shien/exercises.json`・
このSKILL.mdの目次（`INDEX:START`〜`INDEX:END` の範囲）が同時に揃う。
マーカーの外側は手書きなので、リビルドしても消えない。

## 未確定・要確認事項

- `promptRole`の意味は、著者による確認済み
- `mode: study`は「学習・練習モード推奨」であることを著者が確認済み
  （Claude.aiのStyles機能にあった「Learning」プリセットとは独立した、
  このSkill自体の振る舞い指示であり、プラットフォーム側の機能の有無に
  依存しない）
