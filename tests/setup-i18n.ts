import { vi } from "vitest";
import messages from "../_locales/ja/messages.json";

type MessageEntry = { message: string; placeholders?: Record<string, { content: string }> };
const messageMap = messages as Record<string, MessageEntry>;

function getMessage(key: string, substitutions?: string | string[]): string {
  const entry = messageMap[key];
  if (!entry) return "";
  let msg = entry.message;
  if (substitutions && entry.placeholders) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    // Chrome の仕様に合わせて $placeholder_name$ を置換
    for (const [name, def] of Object.entries(entry.placeholders)) {
      const match = def.content.match(/^\$(\d+)$/);
      if (!match) continue;
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < subs.length) {
        msg = msg.replace(new RegExp(`\\$${name}\\$`, "gi"), subs[idx]);
      }
    }
  }
  return msg;
}

const i18nMock = {
  getMessage: vi.fn(getMessage),
  getUILanguage: vi.fn(() => "ja"),
};

// chrome オブジェクトがまだ定義されていない場合に基本的な i18n モックを設定
if (typeof globalThis.chrome === "undefined") {
  Object.defineProperty(globalThis, "chrome", {
    value: { i18n: i18nMock },
    writable: true,
    configurable: true,
  });
} else if (!(globalThis.chrome as Record<string, unknown>).i18n) {
  (globalThis.chrome as Record<string, unknown>).i18n = i18nMock;
}
