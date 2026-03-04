export interface ObjectSetting {
  enabled: boolean;
  mode: 'simple' | 'custom';
  // 簡易モード（Phase 2 互換）
  fieldLabel: string;
  showLabel: boolean;
  // カスタムモード（Phase 3）
  format: string;
  // 共通（任意）
  alias: string;
}

export interface ObjectSettings {
  [key: string]: ObjectSetting;
}
