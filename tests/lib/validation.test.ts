import { describe, expect, it } from 'vitest';
import type { CardState } from '../../src/lib/types';
import { checkDuplicateObjectNames, validateCards } from '../../src/lib/validation';

function makeCard(overrides: Partial<CardState> = {}): CardState {
  return {
    id: '1',
    objectName: '商品',

    mode: 'simple',
    fieldLabel: '商品コード',
    showLabel: true,
    format: '',
    ...overrides,
  };
}

describe('checkDuplicateObjectNames', () => {
  it('returns empty array when no duplicates', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品' }),
      makeCard({ id: '2', objectName: '取引先' }),
    ];
    expect(checkDuplicateObjectNames(cards)).toEqual([]);
  });

  it('detects duplicate object names', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品' }),
      makeCard({ id: '2', objectName: '商品' }),
    ];
    expect(checkDuplicateObjectNames(cards)).toEqual(['商品']);
  });

  it('ignores empty object names', () => {
    const cards = [makeCard({ id: '1', objectName: '' }), makeCard({ id: '2', objectName: '' })];
    expect(checkDuplicateObjectNames(cards)).toEqual([]);
  });

  it('trims whitespace before comparison', () => {
    const cards = [
      makeCard({ id: '1', objectName: ' 商品 ' }),
      makeCard({ id: '2', objectName: '商品' }),
    ];
    expect(checkDuplicateObjectNames(cards)).toEqual(['商品']);
  });
});

describe('validateCards', () => {
  it('passes with valid simple mode card', () => {
    const result = validateCards([makeCard()]);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.duplicateObjectNames).toEqual([]);
  });

  it('passes with valid custom mode card', () => {
    const result = validateCards([makeCard({ mode: 'custom', format: '${name}(${商品コード})' })]);
    expect(result.valid).toBe(true);
  });

  it('fails when objectName is empty', () => {
    const result = validateCards([makeCard({ objectName: '' })]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({ cardId: '1', field: 'objectName' });
  });

  it('fails when fieldLabel is empty in simple mode', () => {
    const result = validateCards([makeCard({ fieldLabel: '' })]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({ cardId: '1', field: 'fieldLabel' });
  });

  it('does not require fieldLabel in custom mode', () => {
    const result = validateCards([makeCard({ mode: 'custom', fieldLabel: '', format: '${name}' })]);
    expect(result.valid).toBe(true);
  });

  it('fails when format is empty in custom mode', () => {
    const result = validateCards([makeCard({ mode: 'custom', format: '' })]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({ cardId: '1', field: 'format' });
  });

  it('does not require format in simple mode', () => {
    const result = validateCards([makeCard({ format: '' })]);
    expect(result.valid).toBe(true);
  });

  it('fails with duplicate object names', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品' }),
      makeCard({ id: '2', objectName: '商品' }),
    ];
    const result = validateCards(cards);
    expect(result.valid).toBe(false);
    expect(result.duplicateObjectNames).toEqual(['商品']);
  });

  it('validates multiple cards independently', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品', fieldLabel: '商品コード' }),
      makeCard({ id: '2', objectName: '', fieldLabel: '' }),
    ];
    const result = validateCards(cards);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContainEqual({ cardId: '2', field: 'objectName' });
    expect(result.errors).toContainEqual({ cardId: '2', field: 'fieldLabel' });
  });

  it('passes with empty card array', () => {
    const result = validateCards([]);
    expect(result.valid).toBe(true);
  });
});
