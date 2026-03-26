// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import { useChromeStorage } from "../../../src/options/hooks/useChromeStorage";
import { DEFAULT_GLOBAL_SETTINGS } from "../../../src/lib/types";

const changeListeners: Array<(changes: Record<string, { newValue: unknown }>) => void> = [];

const chromeMock = {
  storage: {
    sync: {
      get: vi.fn((_defaults: unknown, cb: (result: Record<string, unknown>) => void) => {
        cb({
          objectSettings: { "商品": { enabled: true, mode: "simple", fieldLabel: "商品コード", showLabel: true, format: "" } },
          globalSettings: { ...DEFAULT_GLOBAL_SETTINGS },
        });
      }),
      set: vi.fn((_data: unknown, cb: () => void) => {
        cb();
      }),
    },
    onChanged: {
      addListener: vi.fn((fn: (changes: Record<string, { newValue: unknown }>) => void) => {
        changeListeners.push(fn);
      }),
      removeListener: vi.fn(),
    },
  },
};

Object.defineProperty(globalThis, "chrome", { value: chromeMock, writable: true });

beforeEach(() => {
  vi.clearAllMocks();
  changeListeners.length = 0;
});

describe("useChromeStorage", () => {
  it("loads initial settings from chrome.storage.sync", () => {
    const { result } = renderHook(() => useChromeStorage());
    const [settings, globalSettings] = result.current;
    expect(settings).toHaveProperty("商品");
    expect(globalSettings).toEqual(DEFAULT_GLOBAL_SETTINGS);
    expect(chromeMock.storage.sync.get).toHaveBeenCalledOnce();
  });

  it("saves settings to chrome.storage.sync", async () => {
    const { result } = renderHook(() => useChromeStorage());
    const [, , save] = result.current;

    const objSettings = { "取引先": { enabled: true, mode: "simple" as const, fieldLabel: "取引先名", showLabel: true, format: "" } };
    const glbSettings = { bulletList: false, linkNameOnly: true };

    await act(async () => {
      await save(objSettings, glbSettings);
    });

    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
      { objectSettings: objSettings, globalSettings: glbSettings },
      expect.any(Function),
    );
  });

  it("registers onChanged listener", () => {
    renderHook(() => useChromeStorage());
    expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalledOnce();
  });

  it("updates settings when onChanged fires", () => {
    const { result } = renderHook(() => useChromeStorage());

    act(() => {
      changeListeners[0]({
        objectSettings: {
          newValue: { "新オブジェクト": { enabled: true, mode: "custom", fieldLabel: "", showLabel: false, format: "${name}" } },
        },
      });
    });

    const [settings] = result.current;
    expect(settings).toHaveProperty("新オブジェクト");
  });

  it("updates globalSettings when onChanged fires", () => {
    const { result } = renderHook(() => useChromeStorage());

    act(() => {
      changeListeners[0]({
        globalSettings: {
          newValue: { bulletList: false, linkNameOnly: false },
        },
      });
    });

    const [, globalSettings] = result.current;
    expect(globalSettings).toEqual({ bulletList: false, bulletStyle: 'custom', bulletChar: '- ', linkNameOnly: false, showObjectName: false, includeToast: false });
  });

  it("removes listener on unmount", () => {
    const { unmount } = renderHook(() => useChromeStorage());
    unmount();
    expect(chromeMock.storage.onChanged.removeListener).toHaveBeenCalledOnce();
  });
});
