import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { t } from '../lib/i18n';
import { exportSettings, parseImportData } from '../lib/settings-io';
import type { CardState, GlobalSettings, ObjectSettings, ValidationError } from '../lib/types';
import { DEFAULT_GLOBAL_SETTINGS } from '../lib/types';
import { validateCards } from '../lib/validation';
import { ObjectCard } from './components/ObjectCard';
import { ObjectList } from './components/ObjectList';
import { GlobalPreview } from './components/Preview';
import { Toast } from './components/Toast';
import { Toggle } from './components/Toggle';
import { type ViewMode, ViewToggle } from './components/ViewToggle';
import { useChromeStorage } from './hooks/useChromeStorage';
import { useToast } from './hooks/useToast';

type Action =
  | { type: 'load'; cards: CardState[] }
  | { type: 'add' }
  | { type: 'remove'; id: string }
  | { type: 'update'; card: CardState }
  | { type: 'setErrors'; errors: ValidationError[]; duplicateObjectNames: string[] };

interface State {
  cards: CardState[];
  errors: ValidationError[];
  duplicateObjectNames: string[];
}

let nextId = 1;

function createCard(overrides: Partial<CardState> = {}): CardState {
  return {
    id: String(nextId++),
    objectName: '',
    mode: 'simple',
    fieldLabel: '',
    showLabel: true,
    format: '',
    ...overrides,
  };
}

// ObjectSettings（storage 形式）を編集用の CardState[] に変換する。
// enabled なエントリのみカード化する。
function settingsToCards(settings: ObjectSettings): CardState[] {
  return Object.entries(settings)
    .filter(([, val]) => val.enabled)
    .map(([key, val]) =>
      createCard({
        objectName: key,
        mode: val.mode ?? 'simple',
        fieldLabel: val.fieldLabel,
        showLabel: val.showLabel,
        format: val.format,
      }),
    );
}

// 編集用の CardState[] を保存形式の ObjectSettings に変換する。
// handleSave と dirty 判定の両方で使う（変換ロジックを一致させるため共通化）。
function cardsToSettings(cards: CardState[]): ObjectSettings {
  const objectSettings: ObjectSettings = {};
  for (const card of cards) {
    objectSettings[card.objectName.trim()] = {
      enabled: true,
      mode: card.mode,
      fieldLabel: card.fieldLabel.trim(),
      showLabel: card.showLabel,
      format: card.format.trim(),
    };
  }
  return objectSettings;
}

// キー順に依存しないディープ等価判定（設定オブジェクトの比較用）。
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return { cards: action.cards, errors: [], duplicateObjectNames: [] };
    case 'add':
      return {
        ...state,
        cards: [...state.cards, createCard()],
        errors: [],
        duplicateObjectNames: [],
      };
    case 'remove':
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.id),
        errors: [],
        duplicateObjectNames: [],
      };
    case 'update':
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.card.id ? action.card : c)),
        errors: state.errors.filter((e) => e.cardId !== action.card.id),
      };
    case 'setErrors':
      return { ...state, errors: action.errors, duplicateObjectNames: action.duplicateObjectNames };
  }
}

export function App() {
  const [storedSettings, storedGlobalSettings, saveSettings] = useChromeStorage();
  const [toastMessage, toastVisible, showToast] = useToast();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    ...DEFAULT_GLOBAL_SETTINGS,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [state, dispatch] = useReducer(reducer, {
    cards: [],
    errors: [],
    duplicateObjectNames: [],
  });

  // ページタイトルと言語を動的に設定
  useEffect(() => {
    document.title = t('options_pageTitle');
    document.documentElement.lang = chrome.i18n.getUILanguage();
  }, []);

  // chrome.storage.local からビュー設定を復元
  useEffect(() => {
    try {
      chrome.storage.local.get({ viewMode: 'card' }, (result) => {
        if (result.viewMode === 'card' || result.viewMode === 'list') {
          setViewMode(result.viewMode);
        }
      });
    } catch {
      // テスト環境等で chrome.storage.local が無い場合は無視
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      chrome.storage.local.set({ viewMode: mode });
    } catch {
      // テスト環境等で chrome.storage.local が無い場合は無視
    }
  };

  useEffect(() => {
    setGlobalSettings(storedGlobalSettings);
  }, [storedGlobalSettings]);

  useEffect(() => {
    const entries = Object.entries(storedSettings);
    if (entries.length === 0 && state.cards.length > 0) return;
    if (entries.length === 0) return;

    dispatch({ type: 'load', cards: settingsToCards(storedSettings) });
  }, [storedSettings]);

  const handleSave = async () => {
    const result = validateCards(state.cards);
    if (!result.valid) {
      dispatch({
        type: 'setErrors',
        errors: result.errors,
        duplicateObjectNames: result.duplicateObjectNames,
      });

      if (result.duplicateObjectNames.length > 0) {
        showToast(t('options_toast_duplicateObject'));
      } else {
        showToast(t('options_toast_validationError'));
      }
      return;
    }

    await saveSettings(cardsToSettings(state.cards), globalSettings);
    showToast(t('options_toast_saved'));
  };

  // 現在の編集内容が保存済みの設定と異なるか（未保存の変更があるか）。
  // 差分が無いときは保存ボタンを非活性にする。
  const isDirty =
    !deepEqual(cardsToSettings(state.cards), storedSettings) ||
    !deepEqual(globalSettings, storedGlobalSettings);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportSettings(storedSettings, storedGlobalSettings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sf-record-linker-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseImportData(text);
    if (!result.success) {
      showToast(result.error);
      return;
    }

    // インポート結果は chrome.storage へ直接書かず、編集用のローカル state へ反映する。
    // 他の編集操作と同様、「保存」ボタンを押すまで確定しない（誤インポートの取り消し・
    // 内容確認を可能にし、未保存編集が storage 同期で消える事故も防ぐ）。
    setGlobalSettings(result.globalSettings);
    dispatch({ type: 'load', cards: settingsToCards(result.objectSettings) });
    showToast(t('options_toast_imported'));

    // ファイル入力をリセット（同じファイルの再選択を許可）
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const errorsForCard = (id: string) => state.errors.filter((e) => e.cardId === id);

  return (
    <>
      <div class="page-header">
        <div class="page-header-row">
          <h1>{t('options_pageTitle')}</h1>
          <div class="header-actions">
            <button type="button" class="btn-secondary" onClick={handleExport}>
              {t('options_btn_export')}
            </button>
            <button type="button" class="btn-secondary" onClick={handleImportClick}>
              {t('options_btn_import')}
            </button>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleImportFile}
            />
            <button type="button" class="btn-save" onClick={handleSave} disabled={!isDirty}>
              {t('options_btn_save')}
            </button>
          </div>
        </div>
        <p>{t('options_description')}</p>
      </div>

      <div class="global-settings">
        <div class="global-settings-heading">{t('options_globalHeading')}</div>
        <Toggle
          label={t('options_toggle_showObjectName')}
          checked={globalSettings.showObjectName}
          onChange={(showObjectName) => setGlobalSettings((prev) => ({ ...prev, showObjectName }))}
        />
        <Toggle
          label={t('options_toggle_linkNameOnly')}
          checked={globalSettings.linkNameOnly}
          onChange={(linkNameOnly) => setGlobalSettings((prev) => ({ ...prev, linkNameOnly }))}
        />
        <Toggle
          label={t('options_toggle_includeToast')}
          checked={globalSettings.includeToast}
          onChange={(includeToast) => setGlobalSettings((prev) => ({ ...prev, includeToast }))}
        />
        <Toggle
          label={t('options_toggle_bulletList')}
          checked={globalSettings.bulletList}
          onChange={(bulletList) => setGlobalSettings((prev) => ({ ...prev, bulletList }))}
        />
        {globalSettings.bulletList && (
          <>
            <div class="segment-control" style={{ marginTop: '-4px' }}>
              <button
                type="button"
                class={`segment-btn ${globalSettings.bulletStyle === 'ul' ? 'active' : ''}`}
                onClick={() =>
                  setGlobalSettings((prev) => ({ ...prev, bulletStyle: 'ul' as const }))
                }
              >
                {t('options_bullet_ul')}
              </button>
              <button
                type="button"
                class={`segment-btn ${globalSettings.bulletStyle === 'custom' ? 'active' : ''}`}
                onClick={() =>
                  setGlobalSettings((prev) => ({ ...prev, bulletStyle: 'custom' as const }))
                }
              >
                {t('options_bullet_custom')}
              </button>
            </div>
            {globalSettings.bulletStyle === 'custom' && (
              <div class="field-group" style={{ marginBottom: '16px' }}>
                <label>{t('options_label_bulletChar')}</label>
                <input
                  class="input-field"
                  style={{ width: '80px' }}
                  value={globalSettings.bulletChar}
                  onInput={(e) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      bulletChar: (e.target as HTMLInputElement).value,
                    }))
                  }
                />
              </div>
            )}
          </>
        )}
        <GlobalPreview
          showObjectName={globalSettings.showObjectName}
          linkNameOnly={globalSettings.linkNameOnly}
          bulletList={globalSettings.bulletList}
          bulletStyle={globalSettings.bulletStyle}
          bulletChar={globalSettings.bulletChar}
          includeToast={globalSettings.includeToast}
        />
      </div>

      {state.cards.length > 0 && (
        <div class="section-header">
          <span class="section-header-label">{t('options_sectionObjectSettings')}</span>
          <ViewToggle mode={viewMode} onChange={handleViewModeChange} />
        </div>
      )}

      {viewMode === 'card' ? (
        <div id="cards">
          {state.cards.map((card) => (
            <ObjectCard
              key={card.id}
              card={card}
              errors={errorsForCard(card.id)}
              linkNameOnly={globalSettings.linkNameOnly}
              showObjectName={globalSettings.showObjectName}
              onChange={(updated) => dispatch({ type: 'update', card: updated })}
              onRemove={() => dispatch({ type: 'remove', id: card.id })}
            />
          ))}
        </div>
      ) : (
        <ObjectList
          cards={state.cards}
          errors={state.errors}
          linkNameOnly={globalSettings.linkNameOnly}
          showObjectName={globalSettings.showObjectName}
          onChange={(updated) => dispatch({ type: 'update', card: updated })}
          onRemove={(id) => dispatch({ type: 'remove', id })}
        />
      )}

      <button type="button" class="btn-add" onClick={() => dispatch({ type: 'add' })}>
        {t('options_btn_addObject')}
      </button>

      <Toast message={toastMessage} visible={toastVisible} />
    </>
  );
}
