// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardState } from '../../src/lib/types';
import { ObjectList } from '../../src/options/components/ObjectList';

afterEach(cleanup);

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

describe('ObjectList', () => {
  it('shows empty message when no cards', () => {
    render(
      <ObjectList
        cards={[]}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.object-list-empty')?.textContent).toBe(
      'オブジェクトごとの拡張設定はまだありません',
    );
  });

  it('renders rows for each card', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品' }),
      makeCard({ id: '2', objectName: '取引先' }),
    ];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const rows = document.querySelectorAll('.list-row');
    expect(rows).toHaveLength(2);
    expect(document.querySelectorAll('.list-row-name')[0].textContent).toBe('商品');
    expect(document.querySelectorAll('.list-row-name')[1].textContent).toBe('取引先');
  });

  it('shows mode badge', () => {
    const cards = [makeCard({ id: '1', mode: 'simple' }), makeCard({ id: '2', mode: 'custom' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const badges = document.querySelectorAll('.mode-badge');
    expect(badges[0].textContent).toBe('簡易');
    expect(badges[1].textContent).toBe('カスタム');
  });

  it('shows config summary for simple mode', () => {
    const cards = [makeCard({ id: '1', fieldLabel: '商品コード' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.list-row-config')?.textContent).toBe('商品コード');
  });

  it('shows config summary for custom mode', () => {
    const cards = [makeCard({ id: '1', mode: 'custom', format: '${name}(${code})' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.list-row-config')?.textContent).toBe('${name}(${code})');
  });

  it('expands and collapses row on click', () => {
    const cards = [makeCard({ id: '1' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    // Initially collapsed
    expect(document.querySelector('.list-row-detail')).toBeNull();
    expect(document.querySelector('.list-row-chevron')?.textContent).toBe('▶');

    // Expand
    fireEvent.click(document.querySelector('.list-row-summary')!);
    expect(document.querySelector('.list-row-detail')).toBeTruthy();
    expect(document.querySelector('.list-row-chevron')?.textContent).toBe('▼');

    // Collapse
    fireEvent.click(document.querySelector('.list-row-summary')!);
    expect(document.querySelector('.list-row-detail')).toBeNull();
  });

  it('only one row expanded at a time', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品' }),
      makeCard({ id: '2', objectName: '取引先' }),
    ];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const summaries = document.querySelectorAll('.list-row-summary');

    // Expand first row
    fireEvent.click(summaries[0]);
    expect(document.querySelectorAll('.list-row-detail')).toHaveLength(1);

    // Expand second row -> first collapses
    fireEvent.click(summaries[1]);
    expect(document.querySelectorAll('.list-row-detail')).toHaveLength(1);
    // Second row's detail should be visible
    const chevrons = document.querySelectorAll('.list-row-chevron');
    expect(chevrons[0].textContent).toBe('▶');
    expect(chevrons[1].textContent).toBe('▼');
  });

  it('calls onRemove when delete button is clicked', () => {
    const onRemove = vi.fn();
    const cards = [makeCard({ id: '1' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(document.querySelector('.btn-remove')!);
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('delete click does not toggle expansion', () => {
    const cards = [makeCard({ id: '1' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(document.querySelector('.btn-remove')!);
    // Should not expand
    expect(document.querySelector('.list-row-detail')).toBeNull();
  });

  it('applies error class on row with error', () => {
    const cards = [makeCard({ id: '1', objectName: '' })];
    const errors = [{ cardId: '1', field: 'objectName' as const }];
    render(
      <ObjectList
        cards={cards}
        errors={errors}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.list-row')?.classList.contains('error')).toBe(true);
  });

  it('auto-expands row with error', () => {
    const cards = [
      makeCard({ id: '1', objectName: '商品' }),
      makeCard({ id: '2', objectName: '' }),
    ];
    const errors = [{ cardId: '2', field: 'objectName' as const }];
    render(
      <ObjectList
        cards={cards}
        errors={errors}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    // Second row should be auto-expanded
    const chevrons = document.querySelectorAll('.list-row-chevron');
    expect(chevrons[1].textContent).toBe('▼');
    expect(document.querySelectorAll('.list-row-detail')).toHaveLength(1);
  });

  it('shows （未設定） for empty object name', () => {
    const cards = [makeCard({ id: '1', objectName: '' })];
    render(
      <ObjectList
        cards={cards}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.list-row-name')?.textContent).toBe('（未設定）');
  });
});
