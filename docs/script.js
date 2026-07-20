// スケルトン：データ読み込みの配線確認用。
// 本UI（3ペイン・二軸ナビ・フィルタ・ステップ別コピー）は Phase 1 で実装する。

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} の読み込みに失敗しました (${res.status})`);
  return res.json();
}

async function init() {
  const statusEl = document.getElementById("status");
  const bookListEl = document.getElementById("book-list");

  try {
    const [books, exercises] = await Promise.all([
      loadJSON("data/books.json"),
      loadJSON("data/exercises.json"),
    ]);

    statusEl.textContent =
      `書籍 ${books.length} シリーズ / 演習データ ${exercises.length} 件を読み込みました。`;

    books
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((book) => {
        const count = exercises.filter((e) => e.bookId === book.id).length;
        const li = document.createElement("li");
        const title = document.createElement("div");
        title.className = "book-title";
        title.textContent = book.title;
        const meta = document.createElement("div");
        meta.className = "book-meta";
        meta.textContent = `演習 ${count} 件`;
        li.append(title, meta);
        bookListEl.appendChild(li);
      });
  } catch (err) {
    statusEl.textContent = `エラー: ${err.message}`;
  }
}

init();
