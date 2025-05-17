
const sheetId = "128IVw_TJENV17IvkVUbSB_sUmoWOIvoDORVfsCh10kc";
const apiKey = "AIzaSyA49NGyeK9bSDwMfZhHqKD6ZZYYPksW2ak";
const categories = ["アルバム", "シングル", "コラボ"];
let currentCategory = "アルバム";
let ownedStatus = JSON.parse(localStorage.getItem("ownedStatus") || "{}");

function switchTab(category) {
  currentCategory = category;
  loadAlbums(category);
}

function loadAlbums(category) {
  const container = document.getElementById("album-container");
  container.innerHTML = "読み込み中...";

  if (category === "全カテゴリ") {
    Promise.all(categories.map(cat => fetchCategory(cat))).then(all => {
      const merged = all.flat();
      renderAlbums(merged);
    });
  } else {
    fetchCategory(category).then(rows => renderAlbums(rows));
  }
}

function fetchCategory(sheetName) {
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const rows = data.values.slice(1).map((row, idx) => ({ row, idx, sheetName }));
      return rows;
    });
}

function renderAlbums(rows) {
  const container = document.getElementById("album-container");
  container.innerHTML = "";

  rows.forEach(({ row, idx, sheetName }) => {
    const [title, catalog, available, notes, imageUrl] = row;
    const id = `${sheetName}_${idx}`;
    const item = document.createElement("div");
    item.className = "album";
    if (ownedStatus[id]) item.classList.add("owned");

    item.onclick = () => {
      item.classList.toggle("owned");
      ownedStatus[id] = item.classList.contains("owned");
      localStorage.setItem("ownedStatus", JSON.stringify(ownedStatus));
      updateStats(rows);
    };

    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = title;
      item.appendChild(img);
    } else {
      const text = document.createElement("div");
      text.textContent = title;
      text.className = "title";
      item.appendChild(text);
    }

    container.appendChild(item);
  });

  updateStats(rows);
}

function updateStats(rows) {
  let total = rows.length;
  let owned = 0;
  let availableTotal = 0;
  let availableOwned = 0;

  rows.forEach(({ idx, row, sheetName }) => {
    const [title, catalog, available] = row;
    const id = `${sheetName}_${idx}`;
    if (ownedStatus[id]) owned++;
    if (available !== "×") {
      availableTotal++;
      if (ownedStatus[id]) availableOwned++;
    }
  });

  document.getElementById("stats").textContent =
    `所持数: ${owned} / ${total}（${(owned / total * 100).toFixed(1)}%）` +
    ` | 入手可能所持数: ${availableOwned} / ${availableTotal}（${(availableOwned / availableTotal * 100).toFixed(1)}%）`;
}

window.onload = () => switchTab("アルバム");
