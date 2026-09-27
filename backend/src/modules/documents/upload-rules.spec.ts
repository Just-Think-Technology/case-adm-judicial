// Upload rules — formats, size cap and delivery as pure data

import {
  MAX_FILE_BYTES,
  extensionOf,
  fileNameWithExtension,
  isAcceptedFile,
  isInline,
} from './upload-rules';

describe('upload rules', () => {
  it('caps files at 60 MB', () => {
    expect(MAX_FILE_BYTES).toBe(60 * 1024 * 1024);
  });

  it('reads the lowercased extension', () => {
    expect(extensionOf('contrato.PDF')).toBe('pdf');
    expect(extensionOf('sem-extensao')).toBe('');
    expect(extensionOf('.htaccess')).toBe('');
  });

  it('accepts the closed set only when extension and MIME agree', () => {
    expect(isAcceptedFile('a.pdf', 'application/pdf')).toBe(true);
    expect(isAcceptedFile('a.JPG', 'image/jpeg')).toBe(true);
    expect(isAcceptedFile('a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(
      true,
    );
    expect(isAcceptedFile('a.pdf', 'image/jpeg')).toBe(false);
    expect(isAcceptedFile('a.exe', 'application/x-msdownload')).toBe(false);
    expect(isAcceptedFile('sem-extensao', 'application/pdf')).toBe(false);
  });

  it('opens browser formats inline and downloads the rest', () => {
    expect(isInline('application/pdf')).toBe(true);
    expect(isInline('image/png')).toBe(true);
    expect(isInline('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(
      false,
    );
  });

  it('completes the download name with the original extension', () => {
    expect(fileNameWithExtension('Petição', 'pdf')).toBe('Petição.pdf');
    expect(fileNameWithExtension('Petição.pdf', 'pdf')).toBe('Petição.pdf');
    expect(fileNameWithExtension('Petição.PDF', 'pdf')).toBe('Petição.PDF');
  });
});
