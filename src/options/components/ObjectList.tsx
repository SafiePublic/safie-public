import { useState, useEffect, useRef } from "preact/hooks";
import type { CardState, ValidationError } from "../../lib/types";
import { t } from "../../lib/i18n";
import { ObjectListRow } from "./ObjectListRow";

interface ObjectListProps {
  cards: CardState[];
  errors: ValidationError[];
  linkNameOnly: boolean;
  showObjectName: boolean;
  onChange: (card: CardState) => void;
  onRemove: (id: string) => void;
}

export function ObjectList({ cards, errors, linkNameOnly, showObjectName, onChange, onRemove }: ObjectListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevCountRef = useRef(cards.length);

  // 新しいカード追加時に自動展開
  useEffect(() => {
    if (cards.length > prevCountRef.current) {
      const lastCard = cards[cards.length - 1];
      setExpandedId(lastCard.id);
    }
    prevCountRef.current = cards.length;
  }, [cards.length]);

  // バリデーションエラー時に該当行を自動展開
  useEffect(() => {
    if (errors.length > 0) {
      const firstErrorCardId = errors[0].cardId;
      setExpandedId(firstErrorCardId);
    }
  }, [errors]);

  if (cards.length === 0) {
    return (
      <div class="object-list-empty">
        {t("options_list_empty")}
      </div>
    );
  }

  const errorsForCard = (id: string) => errors.filter((e) => e.cardId === id);

  return (
    <div class="object-list">
      {cards.map((card) => (
        <ObjectListRow
          key={card.id}
          card={card}
          errors={errorsForCard(card.id)}
          linkNameOnly={linkNameOnly}
          showObjectName={showObjectName}
          expanded={expandedId === card.id}
          onChange={onChange}
          onRemove={() => onRemove(card.id)}
          onToggle={() => setExpandedId(expandedId === card.id ? null : card.id)}
        />
      ))}
    </div>
  );
}
