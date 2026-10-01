// E-mail templates — PT-BR content, pure functions, no transport

export interface OutgoingMail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Escapes user input for HTML interpolation. Names come from registration and
 * are rendered inside the template — unescaped, a name is stored XSS in every
 * client that opens the message.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BRAND_FONT = `font-family:Arial,Helvetica,sans-serif;color:#0a112b;`;

function layout(title: string, name: string, lines: string[], buttonLabel: string, link: string): OutgoingMail {
  const safeName = escapeHtml(name);
  const paragraphs = lines.map((line) => `<p style="margin:0 0 12px;">${line}</p>`).join('');
  const html = [
    `<div style="${BRAND_FONT}background-color:#f3eee0;padding:24px 12px;">`,
    '<div style="max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #e3ddcb;border-radius:12px;overflow:hidden;">',
    '<div style="background-color:#0a112b;padding:20px 28px;">',
    '<p style="margin:0;font-size:11px;letter-spacing:2px;color:#dca729;">CASE ADMINISTRAÇÃO JUDICIAL</p>',
    `<p style="margin:6px 0 0;font-size:20px;font-weight:bold;color:#ffffff;">${title}</p>`,
    '</div>',
    '<div style="padding:24px 28px;font-size:15px;line-height:1.6;">',
    `<p style="margin:0 0 12px;">Olá, ${safeName}!</p>`,
    paragraphs,
    `<p style="margin:20px 0 8px;"><a href="${link}" style="display:inline-block;background-color:#dca729;color:#0a112b;font-weight:bold;font-size:14px;letter-spacing:1px;text-decoration:none;padding:12px 28px;border-radius:8px;">${buttonLabel}</a></p>`,
    '<p style="margin:12px 0 0;font-size:13px;color:#5a5a5a;">Se você não solicitou este e-mail, apenas ignore.</p>',
    '</div>',
    '<div style="padding:14px 28px;border-top:1px solid #e3ddcb;">',
    '<p style="margin:0;font-size:12px;color:#8a8a8a;">Case Administração Judicial — Portal do Credor</p>',
    '</div>',
    '</div>',
    '</div>',
  ].join('');
  return {
    subject: title,
    html,
    text: [`Olá, ${name}!`, ...lines, `${buttonLabel}: ${link}`, 'Se você não solicitou este e-mail, apenas ignore.'].join(
      '\n\n',
    ),
  };
}

/**
 * Verification message sent at registration and on resend.
 *
 * @param name - The account holder, escaped before interpolation
 * @param link - The absolute verification URL carrying the single-use token
 */
export function buildVerificationEmail(name: string, link: string): OutgoingMail {
  const mail = layout(
    'Confirmação de email',
    name,
    [
      'Seu cadastro no Portal do Credor foi criado. Para ativar sua conta, confirme seu e-mail clicando no botão abaixo.',
      'Verifique também a caixa de spam, caso a mensagem não apareça na caixa de entrada.',
    ],
    'VERIFICAR E-MAIL',
    link,
  );
  return mail;
}

/**
 * Password-reset message sent on request.
 *
 * @param name - The account holder, escaped before interpolation
 * @param link - The absolute reset URL carrying the single-use token
 */
export function buildPasswordResetEmail(name: string, link: string): OutgoingMail {
  return layout(
    'Redefinição de senha',
    name,
    [
      'Recebemos uma solicitação de redefinição de senha para a sua conta. Se foi você, clique no botão abaixo para escolher uma nova senha.',
    ],
    'REDEFINIR SENHA',
    link,
  );
}

export interface NewDocumentNotice {
  documentName: string;
  companyName: string;
  addedBy: string;
  typeLabel: string;
  description: string | null;
  sentAt: Date;
}

/**
 * New-document notice to the fixed office address. Deliberately link-free —
 * there is nothing to click, and the test harness asserts the captured mail
 * carries no link.
 *
 * @param notice - The stored document facts, every user string escaped
 */
export function buildNewDocumentEmail(notice: NewDocumentNotice): OutgoingMail {
  const lines = [
    `Documento: ${escapeHtml(notice.documentName)}`,
    `Empresa: ${escapeHtml(notice.companyName)}`,
    `Adicionado por: ${escapeHtml(notice.addedBy)}`,
    `Tipo: ${escapeHtml(notice.typeLabel)}`,
    ...(notice.description ? [`Descrição: ${escapeHtml(notice.description)}`] : []),
    `Data/hora do envio: ${notice.sentAt.toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' })}`,
  ];
  return {
    subject: `Novo documento adicionado por ${notice.addedBy}`,
    html: [`<p>Olá!</p>`, ...lines.map((line) => `<p>${line}</p>`), '<p>Case Administração Judicial</p>'].join(
      '',
    ),
    text: ['Olá!', ...lines, 'Case Administração Judicial'].join('\n\n'),
  };
}
