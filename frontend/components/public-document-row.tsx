import type { PublicDocument } from '@/lib/types';

// Visitor document row: name only, no status or actions (§4.8d). Download
// goes through the BFF content proxy so the browser never hits the backend.
// In bare mode it renders only the inner content for embedding in richer rows.
export function PublicDocumentRow({
  document,
  bare = false,
}: {
  document: PublicDocument;
  bare?: boolean;
}): React.ReactNode {
  const label = document.customType ?? document.type;
  const inner = (
    <>
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist-50 text-navy-950">
        <FileIcon />
      </span>
      <div className="min-w-0 flex-1">
        <a
          href={`/bff/documents/${document.id}/content`}
          target="_blank"
          rel="noreferrer"
          className="block truncate font-semibold text-navy-950 hover:text-gold-600 hover:underline"
          title={document.name}
        >
          {document.name}
        </a>
        <p className="truncate text-xs text-navy-950/60">{label}</p>
      </div>
    </>
  );
  if (bare) return inner;
  return (
    <li data-testid="public-document" className="flex items-center gap-3 rounded-lg border border-navy-950/10 bg-paper-50 px-4 py-3">
      {inner}
    </li>
  );
}

function FileIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 2.5h6l4 4v11H5v-15Z" strokeLinejoin="round" />
      <path d="M11 2.5v4h4" strokeLinejoin="round" />
    </svg>
  );
}
