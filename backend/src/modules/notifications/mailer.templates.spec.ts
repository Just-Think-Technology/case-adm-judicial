// E-mail templates — PT-BR content, links, and user-input escaping

import {
  buildNewDocumentEmail,
  buildPasswordResetEmail,
  buildVerificationEmail,
  escapeHtml,
} from './mailer.templates';

describe('escapeHtml', () => {
  it('escapes markup so a name can never break out of the template', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
  });

  it('escapes quotes and ampersands', () => {
    expect(escapeHtml('"Tom & Jerry"')).toBe('&quot;Tom &amp; Jerry&quot;');
  });

  it('leaves plain names untouched', () => {
    expect(escapeHtml('Maria da Silva')).toBe('Maria da Silva');
  });
});

describe('buildVerificationEmail', () => {
  const mail = buildVerificationEmail('Maria', 'http://localhost/verificar-email?token=abc');

  it('uses the contract subject', () => {
    expect(mail.subject).toBe('Confirmação de email');
  });

  it('greets by name and links the verification button', () => {
    expect(mail.html).toContain('Maria');
    expect(mail.html).toContain('VERIFICAR E-MAIL');
    expect(mail.html).toContain('http://localhost/verificar-email?token=abc');
  });

  it('centers the verification button', () => {
    expect(mail.html).toContain('text-align:center');
    expect(mail.html).toContain('VERIFICAR E-MAIL');
  });

  it('carries the raw link in the plain-text version', () => {
    expect(mail.text).toContain('http://localhost/verificar-email?token=abc');
  });

  it('escapes a hostile name in both versions', () => {
    const hostile = buildVerificationEmail('<b>Maria</b>', 'http://localhost/l');

    expect(hostile.html).not.toContain('<b>Maria</b>');
    expect(hostile.html).toContain('&lt;b&gt;Maria&lt;/b&gt;');
  });
});

describe('buildPasswordResetEmail', () => {
  const mail = buildPasswordResetEmail('João', 'http://localhost/redefinir-senha?token=xyz');

  it('uses the contract subject', () => {
    expect(mail.subject).toBe('Redefinição de senha');
  });

  it('says the request came from the user and links the reset button', () => {
    expect(mail.html).toContain('João');
    expect(mail.html).toContain('REDEFINIR SENHA');
    expect(mail.html).toContain('http://localhost/redefinir-senha?token=xyz');
  });

  it('carries the raw link in the plain-text version', () => {
    expect(mail.text).toContain('http://localhost/redefinir-senha?token=xyz');
  });
});

describe('buildNewDocumentEmail', () => {
  const mail = buildNewDocumentEmail({
    documentName: 'Petição inicial.pdf',
    companyName: 'Empresa Exemplo S.A.',
    addedBy: 'Maria da Silva',
    typeLabel: 'Habilitação de crédito',
    description: 'Documento de habilitação',
    sentAt: new Date('2026-10-02T14:30:00'),
  });

  it('names the sender in the subject', () => {
    expect(mail.subject).toBe('Novo documento adicionado por Maria da Silva');
  });

  it('shares the brand frame with the account e-mails', () => {
    expect(mail.html).toContain('CASE ADMINISTRAÇÃO JUDICIAL');
    expect(mail.html).toContain('background-color:#0a112b');
  });

  it('lists the stored facts and carries no link', () => {
    expect(mail.html).toContain('Petição inicial.pdf');
    expect(mail.html).toContain('Empresa Exemplo S.A.');
    expect(mail.html).not.toContain('<a href=');
    expect(mail.text).not.toMatch(/https?:\/\//);
  });

  it('escapes hostile user input in both versions', () => {
    const hostile = buildNewDocumentEmail({
      documentName: '<img src=x onerror=alert(1)>.pdf',
      companyName: 'Empresa Exemplo S.A.',
      addedBy: '<b>Maria</b>',
      typeLabel: 'Habilitação de crédito',
      description: null,
      sentAt: new Date('2026-10-02T14:30:00'),
    });

    expect(hostile.html).not.toContain('<img src=x onerror=alert(1)>');
    expect(hostile.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(hostile.html).not.toContain('<b>Maria</b>');
  });
});
