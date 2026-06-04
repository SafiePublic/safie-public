// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardState } from '../../src/lib/types';
import { ObjectForm } from '../../src/options/components/ObjectForm';

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

describe('ObjectForm', () => {
  it('renders object name input with value', () => {
    render(
      <ObjectForm
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
      />,
    );
    const input = document.querySelector<HTMLInputElement>('.input-field');
    expect(input?.value).toBe('商品');
  });

  it('calls onChange when object name changes', () => {
    const onChange = vi.fn();
    render(
      <ObjectForm
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={onChange}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('.input-field');
    fireEvent.input(inputs[0], { target: { value: '取引先' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ objectName: '取引先' }));
  });

  it('switches mode via segment control', () => {
    const onChange = vi.fn();
    render(
      <ObjectForm
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('カスタムフォーマット'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'custom' }));
  });

  it('shows preview', () => {
    render(
      <ObjectForm
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
      />,
    );
    expect(document.querySelector('.preview')).toBeTruthy();
    expect(document.querySelector('.preview-text u')?.textContent).toBe('レコード名');
  });

  it('applies error class on objectName error', () => {
    const errors = [{ cardId: '1', field: 'objectName' as const }];
    render(
      <ObjectForm
        card={makeCard({ objectName: '' })}
        errors={errors}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
      />,
    );
    const input = document.querySelector<HTMLInputElement>('.input-field');
    expect(input?.classList.contains('error')).toBe(true);
  });

  it('applies error class on fieldLabel error', () => {
    const errors = [{ cardId: '1', field: 'fieldLabel' as const }];
    render(
      <ObjectForm
        card={makeCard({ fieldLabel: '' })}
        errors={errors}
        linkNameOnly={true}
        showObjectName={false}
        onChange={vi.fn()}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('.input-field');
    // inputs[0]=objectName, inputs[1]=fieldLabel
    expect(inputs[1].classList.contains('error')).toBe(true);
  });

  it('toggles showLabel via toggle switch', () => {
    const onChange = vi.fn();
    render(
      <ObjectForm
        card={makeCard()}
        errors={[]}
        linkNameOnly={true}
        showObjectName={false}
        onChange={onChange}
      />,
    );
    const checkbox = document.querySelector<HTMLInputElement>('.toggle-input')!;
    fireEvent.change(checkbox, { target: { checked: false } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showLabel: false }));
  });
});
