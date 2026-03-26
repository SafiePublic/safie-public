import type { CardState, ValidationError } from "../../lib/types";
import { t } from "../../lib/i18n";
import { SegmentControl } from "./SegmentControl";
import { Toggle } from "./Toggle";
import { Preview } from "./Preview";

export interface ObjectFormProps {
  card: CardState;
  errors: ValidationError[];
  linkNameOnly: boolean;
  showObjectName: boolean;
  onChange: (card: CardState) => void;
}

export function ObjectForm({ card, errors, linkNameOnly, showObjectName, onChange }: ObjectFormProps) {
  const fieldError = (field: ValidationError["field"]) =>
    errors.some((e) => e.field === field);

  const update = (partial: Partial<CardState>) => {
    onChange({ ...card, ...partial });
  };

  return (
    <>
      <div class="field-group">
        <label>{t("options_form_label_objectName")}</label>
        <input
          type="text"
          class={`input-field${fieldError("objectName") ? " error" : ""}`}
          value={card.objectName}
          placeholder={t("options_form_placeholder_objectName")}
          onInput={(e) => update({ objectName: (e.target as HTMLInputElement).value })}
        />
      </div>

      <SegmentControl mode={card.mode} onChange={(mode) => update({ mode })} />

      <div class={`mode-section${card.mode === "simple" ? " visible" : ""}`}>
        <div class="field-group">
          <label>{t("options_form_label_fieldLabel")}</label>
          <input
            type="text"
            class={`input-field${fieldError("fieldLabel") ? " error" : ""}`}
            value={card.fieldLabel}
            placeholder={t("options_form_placeholder_fieldLabel")}
            onInput={(e) => update({ fieldLabel: (e.target as HTMLInputElement).value })}
          />
        </div>

        <Toggle
          label={t("options_form_toggle_showLabel")}
          checked={card.showLabel}
          onChange={(showLabel) => update({ showLabel })}
        />
      </div>

      <div class={`mode-section${card.mode === "custom" ? " visible" : ""}`}>
        <div class="field-group">
          <label>{t("options_form_label_format")}</label>
          <input
            type="text"
            class={`input-field${fieldError("format") ? " error" : ""}`}
            value={card.format}
            placeholder={t("options_form_placeholder_format")}
            onInput={(e) => update({ format: (e.target as HTMLInputElement).value })}
          />
          <div class="help-text">
            <code>{"${name}"}</code> {t("options_form_help_nameVar")} / <code>{"${object}"}</code> {t("options_form_help_objectVar")}
            <br />
            <code>{t("options_form_help_fieldVarExample")}</code> {t("options_form_help_fieldVar")}
          </div>
        </div>
      </div>

      <Preview card={card} linkNameOnly={linkNameOnly} showObjectName={showObjectName} />
    </>
  );
}
