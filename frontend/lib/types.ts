// Shapes mirrored from the backend contract (companies.service,
// documents.service). The backend stays the source of truth; these exist so
// components never use `any` for API payloads.

export type CompanyNature = 'Recuperação Judicial' | 'Falência';

export interface CompanyCard {
  id: string;
  name: string;
  nature: CompanyNature;
  processNumber: string;
  createdAt: string;
}

export interface CompanyDetails extends CompanyCard {
  judicialAdmin: string;
  judge: string;
  protocolDate: string;
  author: string;
  comarca: string;
  observations: string | null;
  updatedAt: string;
}

export interface PublicDocument {
  id: string;
  name: string;
  type: string;
  customType: string | null;
}
