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

function layout(title: string, name: string, lines: string[], buttonLabel: string, link: string): OutgoingMail {
  const safeName = escapeHtml(name);
  const paragraphs = lines.map((line) => `<p>${line}</p>`).join('');
  return {
    subject: title,
    html: [
      `<p>Olá, ${safeName}!</p>`,
      paragraphs,
      `<p><a href="${link}">${buttonLabel}</a></p>`,
      '<p>Se você não solicitou este e-mail, apenas ignore.</p>',
    ].join(''),
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
