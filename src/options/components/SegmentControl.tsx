import { t } from "../../lib/i18n";

interface SegmentControlProps {
  mode: "simple" | "custom";
  onChange: (mode: "simple" | "custom") => void;
}

export function SegmentControl({ mode, onChange }: SegmentControlProps) {
  return (
    <div class="segment-control">
      <button
        type="button"
        class={`segment-btn${mode === "simple" ? " active" : ""}`}
        onClick={() => onChange("simple")}
      >
        {t("options_segment_simple")}
      </button>
      <button
        type="button"
        class={`segment-btn${mode === "custom" ? " active" : ""}`}
        onClick={() => onChange("custom")}
      >
        {t("options_segment_custom")}
      </button>
    </div>
  );
}
