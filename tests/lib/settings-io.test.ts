import { describe, expect, it } from 'vitest';
import { exportSettings, parseImportData } from '../../src/lib/settings-io';
import type { GlobalSettings, ObjectSettings } from '../../src/lib/types';
import { DEFAULT_GLOBAL_SETTINGS } from '../../src/lib/types';

describe('exportSettings', () => {
  it('produces valid JSON with version and timestamps', () => {
    const json = exportSettings({}, DEFAULT_GLOBAL_SETTINGS);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBeTruthy();
    expect(parsed.objectSettings).toEqual({});
    expect(parsed.globalSettings).toEqual(DEFAULT_GLOBAL_SETTINGS);
  });
});

describe('parseImportData', () => {
  function makeExportJson(
    objectSettings: ObjectSettings = {},
    globalSettings: GlobalSettings = DEFAULT_GLOBAL_SETTINGS,
  ): string {
    return exportSettings(objectSettings, globalSettings);
  }

  it('round-trips exported data', () => {
    const objSettings: ObjectSettings = {
      商品: {
        enabled: true,
        mode: 'simple',
        fieldLabel: '商品コード',
        showLabel: true,
        format: '',
      },
    };
    const glbSettings: GlobalSettings = {
      ...DEFAULT_GLOBAL_SETTINGS,
      linkNameOnly: false,
      showObjectName: true,
    };

    const json = makeExportJson(objSettings, glbSettings);
    const result = parseImportData(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.objectSettings).toEqual(objSettings);
      expect(result.globalSettings).toEqual(glbSettings);
    }
  });

  it('fails on invalid JSON', () => {
    const result = parseImportData('not json');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('JSONの解析に失敗しました');
    }
  });

  it('fails when objectSettings is missing', () => {
    const result = parseImportData(JSON.stringify({ globalSettings: {} }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('objectSettings');
    }
  });

  it('fails when globalSettings is missing', () => {
    const result = parseImportData(JSON.stringify({ objectSettings: {} }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('globalSettings');
    }
  });

  it('fails on invalid mode value', () => {
    const json = JSON.stringify({
      objectSettings: {
        商品: { enabled: true, mode: 'invalid', fieldLabel: '', showLabel: true, format: '' },
      },
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
    });
    const result = parseImportData(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('mode');
    }
  });

  it('fails on invalid enabled value', () => {
    const json = JSON.stringify({
      objectSettings: {
        商品: { enabled: 'yes', mode: 'simple', fieldLabel: '', showLabel: true, format: '' },
      },
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
    });
    const result = parseImportData(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('enabled');
    }
  });

  it('merges missing globalSettings fields with defaults', () => {
    const json = JSON.stringify({
      objectSettings: {},
      globalSettings: { linkNameOnly: false },
    });
    const result = parseImportData(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.globalSettings.bulletList).toBe(DEFAULT_GLOBAL_SETTINGS.bulletList);
      expect(result.globalSettings.bulletStyle).toBe(DEFAULT_GLOBAL_SETTINGS.bulletStyle);
      expect(result.globalSettings.bulletChar).toBe(DEFAULT_GLOBAL_SETTINGS.bulletChar);
      expect(result.globalSettings.linkNameOnly).toBe(false);
      expect(result.globalSettings.showObjectName).toBe(DEFAULT_GLOBAL_SETTINGS.showObjectName);
    }
  });
});
