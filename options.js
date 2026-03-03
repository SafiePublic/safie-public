/**
 * SF Record Linker — 設定画面ロジック
 * クラスベース設計、event delegation、リアルタイムプレビュー
 */
class SettingsManager {
  #container;
  #btnAdd;
  #btnSave;
  #toastEl;
  #toastTimer;

  constructor() {
    this.#container = document.getElementById("cards");
    this.#btnAdd = document.getElementById("btn-add");
    this.#btnSave = document.getElementById("btn-save");
    this.#toastEl = document.getElementById("toast");

    this.#btnAdd.addEventListener("click", () => this.#addCard());
    this.#btnSave.addEventListener("click", () => this.#save());

    // event delegation: input / change / click をコンテナで一括処理
    this.#container.addEventListener("input", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      // エラー状態をクリア
      if (e.target.classList.contains("input-field")) {
        e.target.classList.remove("error");
      }
      if (card.classList.contains("error")) {
        card.classList.remove("error");
      }
      this.#updatePreview(card);
    });

    this.#container.addEventListener("change", (e) => {
      if (!e.target.classList.contains("toggle-input")) return;
      const card = e.target.closest(".card");
      if (card) this.#updatePreview(card);
    });

    this.#container.addEventListener("click", (e) => {
      if (!e.target.classList.contains("btn-remove")) return;
      const card = e.target.closest(".card");
      if (card) this.#removeCard(card);
    });

    this.#load();
  }

  #load() {
    chrome.storage.sync.get({ objectSettings: {} }, (result) => {
      const settings = result.objectSettings;
      for (const [key, val] of Object.entries(settings)) {
        if (val.enabled) {
          this.#addCard(key, val.fieldLabel, val.showLabel);
        }
      }
    });
  }

  #save() {
    if (!this.#validate()) return;

    const cards = this.#container.querySelectorAll(".card");
    const objectSettings = {};

    cards.forEach((card) => {
      const objectName = card.querySelector(".input-object").value.trim();
      const fieldLabel = card.querySelector(".input-label").value.trim();
      const showLabel = card.querySelector(".toggle-input").checked;

      objectSettings[objectName] = {
        enabled: true,
        fieldLabel,
        showLabel,
      };
    });

    chrome.storage.sync.set({ objectSettings }, () => {
      this.#showToast("設定を保存しました");
    });
  }

  #validate() {
    const cards = this.#container.querySelectorAll(".card");
    let valid = true;
    const seen = new Set();

    cards.forEach((card) => {
      const objectInput = card.querySelector(".input-object");
      const labelInput = card.querySelector(".input-label");
      const objectName = objectInput.value.trim();
      const fieldLabel = labelInput.value.trim();

      // 空欄チェック
      if (!objectName) {
        objectInput.classList.add("error");
        card.classList.add("error");
        valid = false;
      }
      if (!fieldLabel) {
        labelInput.classList.add("error");
        card.classList.add("error");
        valid = false;
      }

      // 重複チェック
      if (objectName && seen.has(objectName)) {
        objectInput.classList.add("error");
        card.classList.add("error");
        this.#showToast("オブジェクト名が重複しています");
        valid = false;
      }
      if (objectName) seen.add(objectName);
    });

    if (!valid && !this.#toastEl.classList.contains("visible")) {
      this.#showToast("入力内容を確認してください");
    }

    return valid;
  }

  #addCard(objectName = "", fieldLabel = "", showLabel = true) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">
        <span class="card-header-label">オブジェクト設定</span>
        <button class="btn-remove">削除</button>
      </div>

      <div class="field-group">
        <label>オブジェクト名</label>
        <input type="text" class="input-field input-object"
               value="${this.#escapeAttr(objectName)}"
               placeholder="例: 商品">
      </div>

      <div class="field-group">
        <label>項目ラベル名</label>
        <input type="text" class="input-field input-label"
               value="${this.#escapeAttr(fieldLabel)}"
               placeholder="例: 商品コード">
      </div>

      <div class="toggle-row">
        <span class="toggle-label">ラベルを表示する</span>
        <label class="toggle">
          <input type="checkbox" class="toggle-input" ${showLabel ? "checked" : ""}>
          <span class="toggle-track"></span>
        </label>
      </div>

      <div class="preview">
        <div class="preview-heading">プレビュー</div>
        <div class="preview-text"></div>
      </div>
    `;

    this.#container.appendChild(card);
    this.#updatePreview(card);
  }

  #removeCard(card) {
    card.remove();
  }

  #updatePreview(card) {
    const label = card.querySelector(".input-label").value.trim() || "ラベル";
    const showLabel = card.querySelector(".toggle-input").checked;
    const text = showLabel ? `レコード名(${label}:値)` : `レコード名(値)`;
    card.querySelector(".preview-text").textContent = text;
  }

  #showToast(msg) {
    clearTimeout(this.#toastTimer);
    this.#toastEl.textContent = msg;
    this.#toastEl.classList.add("visible");
    this.#toastTimer = setTimeout(() => {
      this.#toastEl.classList.remove("visible");
    }, 2000);
  }

  #escapeAttr(str) {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }
}

new SettingsManager();
