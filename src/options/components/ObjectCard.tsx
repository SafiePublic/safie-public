import type { CardState, ValidationError } from "../../lib/types";
import { t } from "../../lib/i18n";
import { ObjectForm } from "./ObjectForm";

interface ObjectCardProps {
  card: CardState;
  errors: ValidationError[];
  linkNameOnly: boolean;
  showObjectName: boolean;
  onChange: (card: CardState) => void;
  onRemove: () => void;
}

export function ObjectCard({ card, errors, linkNameOnly, showObjectName, onChange, onRemove }: ObjectCardProps) {
  const hasError = errors.length > 0;

  return (
    <div class={`card${hasError ? " error" : ""}`}>
      <div class="card-header">
        <span class="card-header-label">{t("options_card_heading")}</span>
        <button class="btn-remove" onClick={onRemove}>
          {t("options_card_btn_remove")}
        </button>
      </div>

      <ObjectForm
        card={card}
        errors={errors}
        linkNameOnly={linkNameOnly}
        showObjectName={showObjectName}
        onChange={onChange}
      />
    </div>
  );
}
