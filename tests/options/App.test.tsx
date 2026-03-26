// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/preact";
import { App } from "../../src/options/App";
import { DEFAULT_GLOBAL_SETTINGS } from "../../src/lib/types";

// Mock chrome.storage API
const storageMock = {
  objectSettings: {} as Record<string, unknown>,
  globalSettings: { ...DEFAULT_GLOBAL_SETTINGS } as Record<string, unknown>,
};

const changeListeners: Array<(changes: Record<string, unknown>) => void> = [];

const localStorageMock: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    sync: {
      get: vi.fn((_defaults: unknown, cb: (result: typeof storageMock) => void) => {
        cb(storageMock);
      }),
      set: vi.fn((_data: unknown, cb: () => void) => {
        cb();
      }),
    },
    local: {
      get: vi.fn((defaults: Record<string, unknown>, cb: (result: Record<string, unknown>) => void) => {
        cb({ ...defaults, ...localStorageMock });
      }),
      set: vi.fn((data: Record<string, unknown>) => {
        Object.assign(localStorageMock, data);
      }),
    },
    onChanged: {
      addListener: vi.fn((fn: (changes: Record<string, unknown>) => void) => {
        changeListeners.push(fn);
      }),
      removeListener: vi.fn(),
    },
  },
};

Object.defineProperty(globalThis, "chrome", { value: chromeMock, writable: true });

function setInputValue(input: HTMLInputElement, value: string) {
  input.value = value;
  fireEvent.input(input);
}

beforeEach(() => {
  vi.clearAllMocks();
  changeListeners.length = 0;
  storageMock.objectSettings = {};
  storageMock.globalSettings = { ...DEFAULT_GLOBAL_SETTINGS };
  // Reset local storage mock
  for (const key of Object.keys(localStorageMock)) delete localStorageMock[key];
  cleanup();
});

describe("App", () => {
  it("renders the page header", () => {
    render(<App />);
    expect(screen.getByText("SF Record Linker 設定")).toBeTruthy();
    expect(screen.getByText("オブジェクトごとにリンクテキストに含める項目を設定します。")).toBeTruthy();
  });

  it("renders global settings section", () => {
    render(<App />);
    expect(screen.getByText("基本設定")).toBeTruthy();
    expect(screen.getByText("複数タブ時に箇条書きでコピー")).toBeTruthy();
    expect(screen.getByText("レコード名のみリンクにする")).toBeTruthy();
  });

  it("starts with no cards", () => {
    render(<App />);
    expect(document.querySelectorAll(".card-header-label")).toHaveLength(0);
  });

  it("adds a card when clicking the add button", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
    expect(document.querySelectorAll(".card-header-label")).toHaveLength(1);
  });

  it("removes a card when clicking delete", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
    expect(document.querySelectorAll(".card-header-label")).toHaveLength(1);

    fireEvent.click(screen.getByText("削除"));
    expect(document.querySelectorAll(".card-header-label")).toHaveLength(0);
  });

  it("shows validation error when saving empty card", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("入力内容を確認してください")).toBeTruthy();
    });
  });

  it("saves valid settings with globalSettings to chrome.storage", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));

    const inputs = document.querySelectorAll<HTMLInputElement>(".input-field");
    // Per card: objectName=0, fieldLabel=1, format=2
    setInputValue(inputs[0], "商品");
    setInputValue(inputs[1], "商品コード");

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        {
          objectSettings: {
            "商品": {
              enabled: true,
              mode: "simple",
              fieldLabel: "商品コード",
              showLabel: true,
              format: "",
            },
          },
          globalSettings: {
            bulletList: false,
            bulletStyle: 'custom',
            bulletChar: '- ',
            linkNameOnly: false,
            showObjectName: false,
            includeToast: false,
          },
        },
        expect.any(Function),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("設定を保存しました")).toBeTruthy();
    });
  });

  it("loads existing settings from chrome.storage", () => {
    storageMock.objectSettings = {
      "商品": {
        enabled: true,
        mode: "simple",
        fieldLabel: "商品コード",
        showLabel: true,
        format: "",
      },
    };

    render(<App />);

    const objectInput = document.querySelector<HTMLInputElement>(".input-field");
    expect(objectInput?.value).toBe("商品");
  });

  it("shows duplicate error when two cards have same object name", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
    fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));

    // Per card: objectName, fieldLabel, format (3 inputs each)
    // Card 1: 0,1,2 — Card 2: 3,4,5
    const inputs1 = document.querySelectorAll<HTMLInputElement>(".input-field");
    setInputValue(inputs1[0], "商品");
    setInputValue(inputs1[1], "商品コード");

    // Re-query after re-renders
    const inputs2 = document.querySelectorAll<HTMLInputElement>(".input-field");
    setInputValue(inputs2[3], "商品");
    setInputValue(inputs2[4], "カテゴリ");

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("オブジェクト名が重複しています")).toBeTruthy();
    });
  });

  it("saves toggled globalSettings", async () => {
    render(<App />);

    // Toggle bulletList on (第4トグル、デフォルトはfalse。includeToast追加により index が 2→3 に)
    const toggles = document.querySelectorAll<HTMLInputElement>(".global-settings .toggle-input");
    fireEvent.change(toggles[3], { target: { checked: true } });

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          globalSettings: {
            bulletList: true,
            bulletStyle: 'custom',
            bulletChar: '- ',
            linkNameOnly: false,
            showObjectName: false,
            includeToast: false,
          },
        }),
        expect.any(Function),
      );
    });
  });

  it("loads globalSettings from chrome.storage", () => {
    storageMock.globalSettings = { bulletList: true, bulletStyle: 'ul', bulletChar: '* ', linkNameOnly: false, showObjectName: true, includeToast: true };

    render(<App />);

    const toggles = document.querySelectorAll<HTMLInputElement>(".global-settings .toggle-input");
    // toggles[0] = showObjectName, toggles[1] = linkNameOnly, toggles[2] = includeToast, toggles[3] = bulletList
    expect(toggles[0].checked).toBe(true);
    expect(toggles[1].checked).toBe(false);
    expect(toggles[2].checked).toBe(true);
    expect(toggles[3].checked).toBe(true);
  });

  describe("view toggle", () => {
    it("does not show view toggle when no cards exist", () => {
      render(<App />);
      expect(document.querySelector(".view-toggle")).toBeNull();
    });

    it("shows view toggle when cards exist", () => {
      render(<App />);
      fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
      expect(document.querySelector(".view-toggle")).toBeTruthy();
    });

    it("defaults to card view", () => {
      render(<App />);
      fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
      expect(document.querySelectorAll(".card-header-label")).toHaveLength(1);
      expect(document.querySelector(".object-list")).toBeNull();
    });

    it("switches to list view", () => {
      render(<App />);
      fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));

      fireEvent.click(screen.getByText("リスト"));
      expect(document.querySelector(".object-list")).toBeTruthy();
      expect(document.querySelectorAll(".card-header-label")).toHaveLength(0);
    });

    it("switches back to card view", () => {
      render(<App />);
      fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));

      fireEvent.click(screen.getByText("リスト"));
      fireEvent.click(screen.getByText("カード"));
      expect(document.querySelectorAll(".card-header-label")).toHaveLength(1);
      expect(document.querySelector(".object-list")).toBeNull();
    });

    it("persists view mode to chrome.storage.local", () => {
      render(<App />);
      fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));

      fireEvent.click(screen.getByText("リスト"));
      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({ viewMode: "list" });
    });

    it("restores view mode from chrome.storage.local", () => {
      localStorageMock.viewMode = "list";

      storageMock.objectSettings = {
        "商品": { enabled: true, mode: "simple", fieldLabel: "商品コード", showLabel: true, format: "" },
      };

      render(<App />);
      // Should be in list view
      expect(document.querySelector(".object-list")).toBeTruthy();
    });

    it("hides view toggle when last card is removed", () => {
      render(<App />);
      fireEvent.click(screen.getByText("+ オブジェクトごとの拡張設定を追加"));
      expect(document.querySelector(".view-toggle")).toBeTruthy();

      fireEvent.click(screen.getByText("削除"));
      expect(document.querySelector(".view-toggle")).toBeNull();
    });
  });
});
