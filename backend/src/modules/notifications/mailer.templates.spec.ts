// E-mail templates — PT-BR content, links, and user-input escaping

import {
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

  it('warns about the spam folder, in both versions', () => {
    expect(mail.html).toMatch(/spam/i);
    expect(mail.text).toMatch(/spam/i);
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
