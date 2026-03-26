export interface ObjectSetting {
  enabled: boolean;
  mode: 'simple' | 'custom';
  // 簡易モード（Phase 2 互換）
  fieldLabel: string;
  showLabel: boolean;
  // カスタムモード（Phase 3）
  format: string;
}

export interface ObjectSettings {
  [key: string]: ObjectSetting;
}

export interface CardState {
  id: string;
  objectName: string;
  mode: 'simple' | 'custom';
  fieldLabel: string;
  showLabel: boolean;
  format: string;
}

export interface ValidationError {
  cardId: string;
  field: 'objectName' | 'fieldLabel' | 'format';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  duplicateObjectNames: string[];
}

export interface GlobalSettings {
  bulletList: boolean;
  bulletStyle: 'ul' | 'custom';
  bulletChar: string;
  linkNameOnly: boolean;
  showObjectName: boolean;
  includeToast: boolean;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  bulletList: false,
  bulletStyle: 'custom',
  bulletChar: '- ',
  linkNameOnly: false,
  showObjectName: false,
  includeToast: false,
};
