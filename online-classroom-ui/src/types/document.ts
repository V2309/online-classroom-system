export interface DocumentViewerItem {
  id: string;
  username: string;
  role: string;
  viewedAt: string | Date;
  isStillInClass: boolean;
}

export interface DocumentStats {
  totalViews: number;
  studentViews: number;
  totalStudents: number;
}

export interface DocumentViewersResponse {
  stats: DocumentStats;
  viewers: DocumentViewerItem[];
}

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string | Date;
  uploadedBy: string;
  classCode: string | null;
  teacher: {
    username: string;
  };
  class?: {
    name: string;
    class_code: string | null;
  } | null;
  _count?: {
    views: number;
  };
  views?: Array<{
    user: {
      id: string;
      username: string;
    };
    viewedAt: string | Date;
  }>;
  viewedByCurrentUser?: boolean;
  firstViewedAt?: string | Date | null;
}

export interface ClassDocumentsResponse {
  files: DocumentItem[];
  count: number;
  page: number;
  limit: number;
}

export interface CreateDocumentPayload {
  name: string;
  url: string;
  type: string;
  size: number;
  classCode: string;
}
