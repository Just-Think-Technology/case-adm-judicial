import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompanyPanel } from './company-panel';
import type { CompanyCard as CompanyCardData } from '@/lib/types';

const COMPANIES: CompanyCardData[] = [
  {
    id: 'c1',
    name: 'Alvorada Alimentos Ltda',
    nature: 'Recuperação Judicial',
    processNumber: '1001234-56.2026.8.11.0001',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Pantanal Transportes SA',
    nature: 'Falência',
    processNumber: '1009876-11.2025.8.11.0002',
    createdAt: '2026-09-21T12:00:00.000Z',
    updatedAt: '2026-09-21T12:00:00.000Z',
  },
  {
    id: 'c3',
    name: 'Beta Construtora RJ Ltda',
    nature: 'Recuperação Judicial',
    processNumber: '1005555-11.2024.8.11.0003',
    createdAt: '2024-03-10T12:00:00.000Z',
    updatedAt: '2024-03-10T12:00:00.000Z',
  },
];

describe('CompanyPanel', () => {
  it('starts on Todas, sorted by most recent first', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'Pantanal Transportes SA',
      'Alvorada Alimentos Ltda',
      'Beta Construtora RJ Ltda',
    ]);
  });

  it('filters by nature tab', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Falência' }));
    expect(screen.getByText('Pantanal Transportes SA')).toBeInTheDocument();
    expect(screen.queryByText('Alvorada Alimentos Ltda')).not.toBeInTheDocument();
  });

  it('filters instantly by company name and process number', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    fireEvent.change(screen.getByPlaceholderText(/buscar por empresa ou processo/i), {
      target: { value: 'alvorada' },
    });
    expect(screen.getByText('Alvorada Alimentos Ltda')).toBeInTheDocument();
  });

  it('shows the retry hint when the search matches nothing', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    fireEvent.change(screen.getByPlaceholderText(/buscar por empresa ou processo/i), {
      target: { value: 'inexistente' },
    });
    expect(screen.getByText(/tente buscar por outro termo/i)).toBeInTheDocument();
  });

  it('sorts by name Z-A', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    fireEvent.change(screen.getByLabelText('Ordenar por nome'), { target: { value: 'za' } });
    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'Pantanal Transportes SA',
      'Beta Construtora RJ Ltda',
      'Alvorada Alimentos Ltda',
    ]);
  });

  it('sorts by newest and oldest creation date', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    const names = () => screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    fireEvent.change(screen.getByLabelText('Ordenar por data de criação'), { target: { value: 'old' } });
    expect(names()[0]).toBe('Beta Construtora RJ Ltda');
    fireEvent.change(screen.getByLabelText('Ordenar por data de criação'), { target: { value: 'new' } });
    expect(names()[0]).toBe('Pantanal Transportes SA');
  });

  it('combines both sorts with the last touch as primary', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    const names = () => screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    fireEvent.change(screen.getByLabelText('Ordenar por nome'), { target: { value: 'za' } });
    expect(names()[0]).toBe('Pantanal Transportes SA');
    fireEvent.change(screen.getByLabelText('Ordenar por data de criação'), { target: { value: 'old' } });
    expect(names()[0]).toBe('Beta Construtora RJ Ltda');
    expect((screen.getByLabelText('Ordenar por nome') as HTMLSelectElement).value).toBe('za');
  });

  it('shows the short empty state per tab without search', () => {
    render(<CompanyPanel companies={[]} />);
    expect(screen.getByText(/nenhuma empresa cadastrada ainda/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Falência' }));
    expect(screen.getByText(/nenhuma empresa em falência/i)).toBeInTheDocument();
  });
});
