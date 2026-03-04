import type { ObjectSetting, ObjectSettings } from "./lib/types";

interface CardParams {
  objectName?: string;
  mode?: 'simple' | 'custom';
  fieldLabel?: string;
  showLabel?: boolean;
  format?: string;
  alias?: string;
}

class SettingsManager {
  #container: HTMLElement;
  #btnAdd: HTMLElement;
  #btnSave: HTMLElement;
  #toastEl: HTMLElement;
  #toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.#container = document.getElementById("cards")!;
    this.#btnAdd = document.getElementById("btn-add")!;
    this.#btnSave = document.getElementById("btn-save")!;
    this.#toastEl = document.getElementById("toast")!;

    this.#btnAdd.addEventListener("click", () => this.#addCard());
    this.#btnSave.addEventListener("click", () => this.#save());

    this.#container.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      const card = target.closest(".card") as HTMLElement | null;
      if (!card) return;
      if (target.classList.contains("input-field")) {
        target.classList.remove("error");
      }
      if (card.classList.contains("error")) {
        card.classList.remove("error");
      }
      this.#updatePreview(card);
    });

    this.#container.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains("toggle-input")) return;
      const card = target.closest(".card") as HTMLElement | null;
      if (card) this.#updatePreview(card);
    });

    this.#container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("btn-remove")) {
        const card = target.closest(".card") as HTMLElement | null;
        if (card) this.#removeCard(card);
        return;
      }
      if (target.classList.contains("segment-btn")) {
        const card = target.closest(".card") as HTMLElement | null;
        if (card) this.#switchMode(card, target);
      }
    });

    this.#load();
  }

  #load(): void {
    chrome.storage.sync.get({ objectSettings: {} }, (result) => {
      const settings = result.objectSettings as ObjectSettings;
      for (const [key, val] of Object.entries(settings)) {
        if (val.enabled) {
          this.#addCard({
            objectName: key,
            mode: val.mode ?? 'simple',
            fieldLabel: val.fieldLabel,
            showLabel: val.showLabel,
            format: val.format,
            alias: val.alias,
          });
        }
      }
    });
  }

  #save(): void {
    if (!this.#validate()) return;

    const cards = this.#container.querySelectorAll(".card");
    const objectSettings: ObjectSettings = {};

    cards.forEach((card) => {
      const objectName = (
        card.querySelector(".input-object") as HTMLInputElement
      ).value.trim();
      const mode = this.#getMode(card as HTMLElement);
      const fieldLabel = (
        card.querySelector(".input-label") as HTMLInputElement
      ).value.trim();
      const showLabel = (
        card.querySelector(".toggle-input") as HTMLInputElement
      ).checked;
      const format = (
        card.querySelector(".input-format") as HTMLInputElement
      ).value.trim();
      const alias = (
        card.querySelector(".input-shortname") as HTMLInputElement
      ).value.trim();

      objectSettings[objectName] = {
        enabled: true,
        mode,
        fieldLabel,
        showLabel,
        format,
        alias,
      };
    });

    chrome.storage.sync.set({ objectSettings }, () => {
      this.#showToast("設定を保存しました");
    });
  }

  #validate(): boolean {
    const cards = this.#container.querySelectorAll(".card");
    let valid = true;
    const seen = new Set<string>();

    cards.forEach((card) => {
      const objectInput = card.querySelector(
        ".input-object",
      ) as HTMLInputElement;
      const objectName = objectInput.value.trim();
      const mode = this.#getMode(card as HTMLElement);

      if (!objectName) {
        objectInput.classList.add("error");
        card.classList.add("error");
        valid = false;
      }

      if (mode === 'simple') {
        const labelInput = card.querySelector(
          ".input-label",
        ) as HTMLInputElement;
        if (!labelInput.value.trim()) {
          labelInput.classList.add("error");
          card.classList.add("error");
          valid = false;
        }
      } else {
        const formatInput = card.querySelector(
          ".input-format",
        ) as HTMLInputElement;
        if (!formatInput.value.trim()) {
          formatInput.classList.add("error");
          card.classList.add("error");
          valid = false;
        }
      }

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

  #addCard(params: CardParams = {}): void {
    const {
      objectName = "",
      mode = "simple",
      fieldLabel = "",
      showLabel = true,
      format = "",
      alias = "",
    } = params;

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
        <label>オブジェクト名(別名)（任意）</label>
        <input type="text" class="input-field input-shortname"
               value="${this.#escapeAttr(alias)}"
               placeholder="例: 商">
      </div>

      <div class="segment-control">
        <button type="button" class="segment-btn${mode === 'simple' ? ' active' : ''}" data-mode="simple">簡易設定</button>
        <button type="button" class="segment-btn${mode === 'custom' ? ' active' : ''}" data-mode="custom">カスタム設定</button>
      </div>

      <div class="mode-section mode-simple${mode === 'simple' ? ' visible' : ''}">
        <div class="field-group">
          <label>項目ラベル名</label>
          <input type="text" class="input-field input-label"
                 value="${this.#escapeAttr(fieldLabel)}"
                 placeholder="例: 商品コード">
        </div>

        <div class="toggle-row">
          <span class="toggle-label">項目ラベル名を表示する</span>
          <label class="toggle">
            <input type="checkbox" class="toggle-input" ${showLabel ? "checked" : ""}>
            <span class="toggle-track"></span>
          </label>
        </div>
      </div>

      <div class="mode-section mode-custom${mode === 'custom' ? ' visible' : ''}">
        <div class="field-group">
          <label>フォーマット</label>
          <input type="text" class="input-field input-format"
                 value="${this.#escapeAttr(format)}"
                 placeholder="例: \${name}(\${商品コード})">
          <div class="help-text">
            <code>\${name}</code> レコード名 / <code>\${object}</code> オブジェクト名 / <code>\${alias}</code> 別名<br>
            <code>\${項目ラベル名}</code> で任意の項目値を参照できます
          </div>
        </div>
      </div>

      <div class="preview">
        <div class="preview-heading">プレビュー</div>
        <div class="preview-text"></div>
      </div>
    `;

    this.#container.appendChild(card);
    this.#updatePreview(card);
  }

  #removeCard(card: HTMLElement): void {
    card.remove();
  }

  #switchMode(card: HTMLElement, btn: HTMLElement): void {
    const mode = btn.dataset.mode as 'simple' | 'custom';
    card.querySelectorAll(".segment-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const simpleSection = card.querySelector(".mode-simple")!;
    const customSection = card.querySelector(".mode-custom")!;
    simpleSection.classList.toggle("visible", mode === "simple");
    customSection.classList.toggle("visible", mode === "custom");

    this.#updatePreview(card);
  }

  #getMode(card: HTMLElement): 'simple' | 'custom' {
    const activeBtn = card.querySelector(".segment-btn.active") as HTMLElement | null;
    return (activeBtn?.dataset.mode as 'simple' | 'custom') ?? 'simple';
  }

  #updatePreview(card: HTMLElement): void {
    const mode = this.#getMode(card);
    const objectName = (card.querySelector(".input-object") as HTMLInputElement).value.trim() || "オブジェクト名";
    const alias = (card.querySelector(".input-shortname") as HTMLInputElement).value.trim() || "別名";

    let text: string;

    if (mode === 'custom') {
      const format = (card.querySelector(".input-format") as HTMLInputElement).value.trim();
      if (!format) {
        text = "レコード名";
      } else {
        text = format.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
          if (key === 'name') return 'レコード名';
          if (key === 'object') return objectName;
          if (key === 'alias') return alias;
          return `[${key}]`;
        });
      }
    } else {
      const label = (card.querySelector(".input-label") as HTMLInputElement).value.trim() || "ラベル";
      const showLabel = (card.querySelector(".toggle-input") as HTMLInputElement).checked;
      text = showLabel ? `レコード名(${label}:値)` : `レコード名(値)`;
    }

    card.querySelector(".preview-text")!.textContent = text;
  }

  #showToast(msg: string): void {
    clearTimeout(this.#toastTimer);
    this.#toastEl.textContent = msg;
    this.#toastEl.classList.add("visible");
    this.#toastTimer = setTimeout(() => {
      this.#toastEl.classList.remove("visible");
    }, 2000);
  }

  #escapeAttr(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }
}

new SettingsManager();
