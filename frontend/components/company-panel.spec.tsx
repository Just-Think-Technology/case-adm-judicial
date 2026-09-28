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
  },
  {
    id: 'c2',
    name: 'Pantanal Transportes SA',
    nature: 'Falência',
    processNumber: '1009876-11.2025.8.11.0002',
    createdAt: '2026-09-21T12:00:00.000Z',
  },
];

describe('CompanyPanel', () => {
  it('starts on Recuperação Judicial showing only RJ companies', () => {
    render(<CompanyPanel companies={COMPANIES} />);
    expect(screen.getByText('Alvorada Alimentos Ltda')).toBeInTheDocument();
    expect(screen.queryByText('Pantanal Transportes SA')).not.toBeInTheDocument();
  });

  it('switches tabs to Falência', () => {
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
    fireEvent.change(screen.getByPlaceholderText(/buscar por empresa ou processo/i), {
      target: { value: '1001234' },
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

  it('shows the per-tab empty state without search', () => {
    render(<CompanyPanel companies={[]} />);
    expect(screen.getByText(/nenhuma empresa de recuperação judicial/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Falência' }));
    expect(screen.getByText(/nenhuma empresa em falência/i)).toBeInTheDocument();
  });
});
