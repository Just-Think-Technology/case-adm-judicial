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
  updatedAt: string;
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

export interface AdminDocument extends PublicDocument {
  status: string;
  visibility: string;
  uploadedBy: string;
}

export interface CompanyInput {
  name: string;
  judicialAdmin: string;
  judge: string;
  nature: string;
  processNumber: string;
  protocolDate: string;
  author: string;
  comarca: string;
  observations: string;
}

export interface ClientItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
  companies: Array<{ id: string; name: string; nature: string }>;
  totalCompanies: number;
}

export interface ClientList {
  items: ClientItem[];
  page: number;
  totalPages: number;
  total: number;
}

export interface ClientDocumentItem {
  id: string;
  name: string;
  type: string;
  customType: string | null;
  company: { id: string; name: string };
  status: string;
  createdAt: string;
}

export interface ClientDocuments {
  user: { id: string; name: string; email: string };
  stats: { total: number; emAnalise: number; deferidos: number; indeferidos: number };
  items: ClientDocumentItem[];
  page: number;
  totalPages: number;
}
