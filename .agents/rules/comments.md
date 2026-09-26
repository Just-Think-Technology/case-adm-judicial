# Comment Style Guide

The examples use **TypeScript/NestJS** and the **Portal do Credor** domain
(`Case`, `Document`, `Creditor`), matching [AGENTS.md § Stack](../../AGENTS.md#stack).
The schema example is Prisma — the chosen ORM.

**Scope:** All source files in the repository (`backend/`, `frontend/`, Docker and config files).
**Enforcement:** Code review convention only — no automated linting.
**Philosophy:** Comments explain *why* and *what* (for complex logic), never *how*. Code should be self-explanatory through clear naming and structure.

---

## Comment Syntax by Language

| Language | Inline | Documentation | Section Header |
|----------|--------|---------------|----------------|
| TypeScript / TSX | `//` | `/** */` (JSDoc) | `// --- Name ---` |
| Prisma | `//` | N/A | `// --- Name ---` |
| SQL | `--` | N/A | `-- --- Name ---` |
| Docker / YAML / Shell | `#` | N/A | `# --- Name ---` |
| JSON / JSONC | `//` (if parser allows) | N/A | `// --- Name ---` |

> **Generated files** (Prisma client, protobuf, etc.) are never edited — ignore them.

---

## File Header

Every source file starts with a **single-line purpose comment**:

```ts
// Document repository — data access for case documents
```

```prisma
// Document schema — document model and visibility/status fields
```

```dockerfile
# Build stage — compiles the NestJS app
```

No copyright, license, author, or date boilerplate. Git history covers provenance.

---

## Section Headers

Major logical sections within a file use a consistent divider:

```ts
// --- Repository Implementation ---
```

```prisma
// --- Enums ---
```

```sql
-- --- Indexes ---
```

- Use `---` (three dashes) on both sides
- Title Case, concise (2–4 words)
- No trailing punctuation
- One blank line before and after

---

## Inline Comments

**When to write:**
- Complex algorithms or non-obvious logic — explain *what* the block does
- Business rule implementations — explain *why* this approach
- Workarounds for library/framework quirks — explain the constraint
- Performance-sensitive choices — explain the tradeoff

**When NOT to write:**
- Self-explanatory code (clear names, simple logic)
- Restating what the code obviously does
- Translating code to English line-by-line

**Style:**
```ts
// Good: explains the why behind a business rule
// Only an admin can change visibility, so the toggle is hidden elsewhere
if (caller.role === 'ADMIN') {
  await this.documents.setVisibility(id, dto.visibility);
}

// Good: explains what a complex block achieves
// Presigned URL is short-lived so a leaked link expires on its own
const url = await this.storage.presign(objectKey, { expiresIn: FIFTEEN_MINUTES });

// Bad: restates the obvious
// Increment counter by 1
counter++;

// Bad: explains how, not why
// Loop through users and filter active ones
const active = users.filter(u => u.isActive);
```

---

## JSDoc (Documentation Comments)

Use `/** */` **only** for exported public APIs: functions, classes, interfaces, types, enums, constants.

```ts
/**
 * Decides whether a caller may read a document, per the visibility matrix.
 * A public document is readable by anyone, including visitors.
 *
 * @param document - Document being read, with owner and visibility
 * @param caller - Authenticated user, or null for a visitor
 * @returns True when the read is allowed
 */
export function canReadDocument(document: Document, caller: User | null): boolean {
  // ...
}
```

**Rules:**
- One-line summary, then blank line, then details if needed
- `@param` for all parameters, `@returns` for non-void, `@throws` for known exceptions
- No `@author`, `@version`, `@since` — git covers this
- No JSDoc for private/internal code — use `//` inline comments instead

---

## Prohibited Patterns

| Pattern | Alternative |
|---------|-------------|
| `// TODO:`, `// FIXME:`, `// NOTE:`, `// HACK:` | Track in the issue tracker |
| Commented-out code | Delete — git has history |
| `// ========` or `// ======` section dividers | Use `// --- Name ---` |
| Multi-line `/* */` for inline comments | Use `//` per line |
| File headers with copyright/license/author | Single-line purpose comment only |

---

## Examples

### TypeScript Service
```ts
// Documents service — business rules for case documents

import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { CasesRepository } from '../cases/cases.repository';
import { NotificationService } from '../notifications/notification.service';

// --- Public API ---

/**
 * Registers a document sent to a case by a verified creditor.
 * Streams the file to object storage and starts it in analysis.
 *
 * @param dto - Validated upload input (case id, name, type, description, file)
 * @returns The stored document, private by default
 * @throws {CaseNotFoundError} If the case does not exist
 * @throws {DuplicateDocumentError} If the same content was already uploaded
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly documents: DocumentsRepository,
    private readonly cases: CasesRepository,
    private readonly notifications: NotificationService,
  ) {}

  async create(dto: CreateDocumentDto): Promise<Document> {
    await this.cases.findByIdOrFail(dto.caseId);

    const storedKey = await this.storage.putStream(dto.file);
    const document = await this.documents.create({
      ...dto,
      objectKey: storedKey,
      // Status and visibility are decided by the system, never by the client
      status: DocumentStatus.EM_ANALISE,
      visibility: dto.sender.isAdmin ? Visibility.PUBLIC : Visibility.PRIVATE,
    });

    // Fire-and-forget: a failed notice must not roll back the saved document
    this.notifications.notifyNewDocument(document).catch(logError);

    return document;
  }

  // --- Private Helpers ---

  private async assertNotDuplicate(hash: string): Promise<void> {
    // Same content twice would inflate the case record and hide duplicates
    await this.documents.assertHashIsUnused(hash);
  }
}
```

### Prisma Schema
```prisma
// Document schema — document model, analysis status and visibility

// --- Enums ---

enum DocumentStatus {
  EM_ANALISE
  DEFERIDO
  INDEFERIDO
}

enum Visibility {
  PUBLIC
  PRIVATE
}

// --- Models ---

model Document {
  id           String         @id @default(cuid())
  name         String
  description  String         @db.Text
  status       DocumentStatus @default(EM_ANALISE)
  visibility   Visibility     @default(PRIVATE)
  objectKey    String
  sizeBytes    Int
  mimeType     String
  extension    String
  contentHash  String         @unique // Blocks the same file twice
  senderId     String
  caseId       String

  // Timestamps
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([caseId, status])
  @@index([senderId])
}
```

### Dockerfile
```dockerfile
# Build stage — compiles the NestJS app

FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first for layer caching
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# --- Runtime Stage ---

FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
USER node

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/main.js"]
```

---

## Code Review Checklist

When reviewing PRs, verify:

- [ ] File has a one-line purpose header
- [ ] Section headers use `// --- Name ---` format
- [ ] Inline comments explain *why* or *what* (complex blocks), not *how*
- [ ] No TODO/FIXME/NOTE/HACK tags
- [ ] No commented-out code
- [ ] Public exports have JSDoc with `@param`, `@returns`, `@throws`
- [ ] Private/internal code uses `//` not `/** */`
- [ ] Non-TS files follow native syntax with the same principles

---

## Rationale

- **English only** — code, identifiers and comments; user-facing copy stays in
  Brazilian Portuguese at the edges (validation messages, e-mails, UI text)
- **No task tags in code** — single source of truth in the issue tracker
- **No dead code** — git history is the archive; commented code rots
- **Minimal headers** — reduces noise, git blame answers "who/when"
- **JSDoc only on public API** — internal code changes frequently; docs rot faster
- **Section headers with `---`** — visually distinct, greppable, consistent
- **Documentation-only enforcement** — keeps CI fast; culture > tooling for style
