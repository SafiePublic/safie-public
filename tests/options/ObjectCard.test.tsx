// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardState } from '../../src/lib/types';
import { ObjectCard } from '../../src/options/components/ObjectCard';

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

describe('ObjectCard', () => {
  it('renders card with object name', () => {
    const card = makeCard();
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const input = document.querySelector<HTMLInputElement>('.input-field');
    expect(input?.value).toBe('商品');
  });

  it('calls onRemove when delete is clicked', () => {
    const onRemove = vi.fn();
    render(
      <ObjectCard
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByText('削除'));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('calls onChange when object name input changes', () => {
    const onChange = vi.fn();
    render(
      <ObjectCard
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('.input-field');
    fireEvent.input(inputs[0], { target: { value: '取引先' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ objectName: '取引先' }));
  });

  it('switches mode via segment control', () => {
    const onChange = vi.fn();
    render(
      <ObjectCard
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('カスタムフォーマット'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'custom' }));
  });

  it('shows simple mode preview with underlined name (linkNameOnly=true)', () => {
    const card = makeCard({ showLabel: true, fieldLabel: '商品コード' });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const u = document.querySelector('.preview-text u');
    expect(u?.textContent).toBe('レコード名');
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名(商品コード:値)');
  });

  it('shows simple mode preview without label (linkNameOnly=true)', () => {
    const card = makeCard({ showLabel: false, fieldLabel: '商品コード' });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const u = document.querySelector('.preview-text u');
    expect(u?.textContent).toBe('レコード名');
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名(値)');
  });

  it('shows custom mode preview', () => {
    const card = makeCard({ mode: 'custom', format: '${name}(${商品コード})' });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const u = document.querySelector('.preview-text u');
    expect(u?.textContent).toBe('レコード名');
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名([商品コード])');
  });

  it('shows custom mode preview with object', () => {
    const card = makeCard({ mode: 'custom', format: '${name} - ${object}' });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名 - 商品');
  });

  it('applies error class on objectName error', () => {
    const card = makeCard({ objectName: '' });
    const errors = [{ cardId: '1', field: 'objectName' as const }];
    render(
      <ObjectCard
        card={card}
        errors={errors}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const cardEl = document.querySelector('.card');
    expect(cardEl?.classList.contains('error')).toBe(true);
  });

  it('toggles showLabel via toggle switch', () => {
    const onChange = vi.fn();
    const card = makeCard({ showLabel: true });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    const checkbox = document.querySelector<HTMLInputElement>('.toggle-input')!;
    fireEvent.change(checkbox, { target: { checked: false } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showLabel: false }));
  });

  it('shows object name prefix in simple mode when showObjectName=true', () => {
    const card = makeCard({ showLabel: true, fieldLabel: '商品コード' });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={true}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.preview-text')?.textContent).toBe(
      '商品: レコード名(商品コード:値)',
    );
  });

  it('does not show object name prefix in custom mode even when showObjectName=true', () => {
    const card = makeCard({ mode: 'custom', format: '${name}(${商品コード})' });
    render(
      <ObjectCard
        card={card}
        errors={[]}
        linkNameOnly={true}
        showObjectName={true}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名([商品コード])');
  });
});
