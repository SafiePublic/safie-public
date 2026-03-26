import { t } from "../../lib/i18n";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div class="view-toggle">
      <button
        type="button"
        class={`view-toggle-btn${mode === "card" ? " active" : ""}`}
        onClick={() => onChange("card")}
      >
        {t("options_viewToggle_card")}
      </button>
      <button
        type="button"
        class={`view-toggle-btn${mode === "list" ? " active" : ""}`}
        onClick={() => onChange("list")}
      >
        {t("options_viewToggle_list")}
      </button>
    </div>
  );
}
