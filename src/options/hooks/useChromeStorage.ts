import { useEffect, useState } from 'preact/hooks';
import type { GlobalSettings, ObjectSettings } from '../../lib/types';
import { DEFAULT_GLOBAL_SETTINGS } from '../../lib/types';

export function useChromeStorage(): [
  ObjectSettings,
  GlobalSettings,
  (objSettings: ObjectSettings, glbSettings: GlobalSettings) => Promise<void>,
] {
  const [settings, setSettings] = useState<ObjectSettings>({});
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    ...DEFAULT_GLOBAL_SETTINGS,
  });

  useEffect(() => {
    chrome.storage.sync.get(
      { objectSettings: {}, globalSettings: DEFAULT_GLOBAL_SETTINGS },
      (result) => {
        setSettings(result.objectSettings as ObjectSettings);
        setGlobalSettings({
          ...DEFAULT_GLOBAL_SETTINGS,
          ...(result.globalSettings as GlobalSettings),
        });
      },
    );

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.objectSettings) {
        setSettings(changes.objectSettings.newValue as ObjectSettings);
      }
      if (changes.globalSettings) {
        setGlobalSettings({
          ...DEFAULT_GLOBAL_SETTINGS,
          ...(changes.globalSettings.newValue as GlobalSettings),
        });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const save = (newSettings: ObjectSettings, newGlobalSettings: GlobalSettings): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        { objectSettings: newSettings, globalSettings: newGlobalSettings },
        () => {
          setSettings(newSettings);
          setGlobalSettings(newGlobalSettings);
          resolve();
        },
      );
    });
  };

  return [settings, globalSettings, save];
}
