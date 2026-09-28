import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LandingPage from './page';

describe('LandingPage', () => {
  it('welcomes to the Portal do Credor', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { name: /Portal do Credor/i })).toBeInTheDocument();
  });

  it('lists the four creditor tasks from the contract', () => {
    render(<LandingPage />);
    for (const task of [
      /rápida e segura/,
      /andamento das suas solicitações/,
      /dados atualizados/,
      /Assembleia Geral de Credores/,
    ]) {
      expect(screen.getByText(task)).toBeInTheDocument();
    }
  });

  it('shortcuts to the panel, signup and login', () => {
    render(<LandingPage />);
    expect(screen.getByRole('link', { name: /painel de documentos/i })).toHaveAttribute('href', '/painel');
    expect(screen.getByRole('link', { name: /criar cadastro/i })).toHaveAttribute('href', '/cadastro');
    expect(screen.getByRole('link', { name: /já tenho conta/i })).toHaveAttribute('href', '/login');
  });

  it('shows the office contact channels', () => {
    render(<LandingPage />);
    expect(screen.getByText('(65) 3358-4126')).toBeInTheDocument();
    expect(screen.getByText('contato@caseadmjudicial.com.br')).toBeInTheDocument();
  });
});
