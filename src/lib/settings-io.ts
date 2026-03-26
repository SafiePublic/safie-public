import type { ObjectSettings, GlobalSettings } from "./types";
import { DEFAULT_GLOBAL_SETTINGS } from "./types";
import { t } from "./i18n";

interface ExportData {
  version: 1;
  exportedAt: string;
  globalSettings: GlobalSettings;
  objectSettings: ObjectSettings;
}

export function exportSettings(
  objectSettings: ObjectSettings,
  globalSettings: GlobalSettings,
): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    globalSettings,
    objectSettings,
  };
  return JSON.stringify(data, null, 2);
}

type ParseResult =
  | { success: true; objectSettings: ObjectSettings; globalSettings: GlobalSettings }
  | { success: false; error: string };

export function parseImportData(json: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, error: t("lib_settingsIo_invalidJson") };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { success: false, error: t("lib_settingsIo_invalidDataFormat") };
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.objectSettings !== "object" || data.objectSettings === null) {
    return { success: false, error: t("lib_settingsIo_missingObjectSettings") };
  }

  if (typeof data.globalSettings !== "object" || data.globalSettings === null) {
    return { success: false, error: t("lib_settingsIo_missingGlobalSettings") };
  }

  const objectSettings = data.objectSettings as Record<string, unknown>;
  for (const [key, val] of Object.entries(objectSettings)) {
    if (typeof val !== "object" || val === null) {
      return { success: false, error: t("lib_settingsIo_invalidEntry", key) };
    }
    const setting = val as Record<string, unknown>;
    if (typeof setting.enabled !== "boolean") {
      return { success: false, error: t("lib_settingsIo_invalidEnabled", key) };
    }
    if (setting.mode !== "simple" && setting.mode !== "custom") {
      return { success: false, error: t("lib_settingsIo_invalidMode", key) };
    }
  }

  // globalSettings は DEFAULT_GLOBAL_SETTINGS とマージ（新フィールド欠落時にデフォルト適用）
  const globalSettings: GlobalSettings = {
    ...DEFAULT_GLOBAL_SETTINGS,
    ...(data.globalSettings as Partial<GlobalSettings>),
  };

  return {
    success: true,
    objectSettings: data.objectSettings as ObjectSettings,
    globalSettings,
  };
}
