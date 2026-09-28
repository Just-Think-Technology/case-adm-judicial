// Upload rules — formats, size cap and delivery decisions as pure data
//
// Everything here is a pure function so the rules stay unit-testable: the
// service orchestrates streams, it does not decide what is acceptable.

/** 60 MB per file — the contract's cap, enforced while streaming. */
export const MAX_FILE_BYTES = 60 * 1024 * 1024;

interface AcceptedFormat {
  extensions: string[];
  mimeTypes: string[];
}

/** The closed set of §9: nothing else is stored, whatever the client claims. */
const ACCEPTED_FORMATS: AcceptedFormat[] = [
  { extensions: ['pdf'], mimeTypes: ['application/pdf'] },
  { extensions: ['jpeg', 'jpg'], mimeTypes: ['image/jpeg'] },
  { extensions: ['png'], mimeTypes: ['image/png'] },
  {
    extensions: ['docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  {
    extensions: ['xlsx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
];

/** MIME types a browser renders instead of downloading (§4.10). */
const INLINE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'text/html',
  'text/csv',
]);

/** Lowercased extension after the last dot, or empty when there is none. */
export function extensionOf(filename: string): string {
  const index = filename.lastIndexOf('.');
  if (index <= 0 || index === filename.length - 1) {
    return '';
  }

  return filename.slice(index + 1).toLowerCase();
}

/**
 * Both signals must agree with the closed set: the extension names the format
 * and the part's MIME type confirms it. Either one outside the set refuses the
 * file — the server never trusts the client's word alone.
 */
export function isAcceptedFile(filename: string, mimeType: string): boolean {
  const extension = extensionOf(filename);
  if (extension === '') {
    return false;
  }

  return ACCEPTED_FORMATS.some(
    (format) =>
      format.extensions.includes(extension) && format.mimeTypes.includes(mimeType.toLowerCase()),
  );
}

/** Whether delivery opens in the browser instead of downloading. */
export function isInline(mimeType: string): boolean {
  return INLINE_MIME_TYPES.has(mimeType.toLowerCase());
}

/**
 * Completes the document name with the original extension when the user typed
 * a name without one, so the download opens with the right application.
 */
export function fileNameWithExtension(name: string, extension: string): string {
  if (extensionOf(name) === extension.toLowerCase()) {
    return name;
  }

  return `${name}.${extension}`;
}
