import type { CardState, ValidationResult } from './types';

export function checkDuplicateObjectNames(cards: CardState[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const card of cards) {
    const name = card.objectName.trim();
    if (name && seen.has(name)) {
      duplicates.add(name);
    }
    if (name) seen.add(name);
  }
  return [...duplicates];
}

export function validateCards(cards: CardState[]): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const duplicateObjectNames = checkDuplicateObjectNames(cards);

  for (const card of cards) {
    if (!card.objectName.trim()) {
      errors.push({ cardId: card.id, field: 'objectName' });
    }

    if (card.mode === 'simple') {
      if (!card.fieldLabel.trim()) {
        errors.push({ cardId: card.id, field: 'fieldLabel' });
      }
    } else {
      if (!card.format.trim()) {
        errors.push({ cardId: card.id, field: 'format' });
      }
    }

    if (duplicateObjectNames.includes(card.objectName.trim())) {
      const alreadyHasObjectNameError = errors.some(
        (e) => e.cardId === card.id && e.field === 'objectName',
      );
      if (!alreadyHasObjectNameError) {
        errors.push({ cardId: card.id, field: 'objectName' });
      }
    }
  }

  return {
    valid: errors.length === 0 && duplicateObjectNames.length === 0,
    errors,
    duplicateObjectNames,
  };
}
