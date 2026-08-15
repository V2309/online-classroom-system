export interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  url: string;
  type: string;
  duration: string | null;
  thumbnailUrl: string | null;
  orderIndex: number;
  chapterId: string | null;
  courseId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isActive: boolean;
}

export interface ChapterItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  courseId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isActive: boolean;
  videos: VideoItem[];
}

export interface FolderItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  classCode: string | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    courses: number;
  };
}

export interface CourseTeacher {
  id: string;
  user: {
    username: string;
    img: string | null;
  };
}

export interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  folderId: string | null;
  classCode: string | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isActive: boolean;
  videos?: VideoItem[];
  chapters?: ChapterItem[];
  folder?: FolderItem | null;
  teacher?: CourseTeacher;
  _count?: {
    videos: number;
  };
}

export interface ClassCoursesResponse {
  courses: CourseItem[];
  count: number;
  folders: FolderItem[];
  allCoursesCount: number;
  page: number;
  limit: number;
}

export interface CreateVideoPayload {
  title: string;
  url: string;
  description?: string;
  duration?: string;
  orderIndex?: number;
}

export interface CreateChapterPayload {
  title: string;
  description?: string;
  orderIndex?: number;
  videos?: CreateVideoPayload[];
}

export interface CreateCoursePayload {
  title: string;
  classCode: string;
  description?: string;
  thumbnailUrl?: string;
  folderId?: string | null;
  chapters?: CreateChapterPayload[];
  newFolderName?: string;
  newFolderDescription?: string;
  newFolderColor?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  folderId?: string | null;
  chapters?: CreateChapterPayload[];
  newFolderName?: string;
  newFolderDescription?: string;
  newFolderColor?: string;
}

export interface CreateFolderPayload {
  name: string;
  classCode: string;
  description?: string | null;
  color?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  description?: string | null;
  color?: string;
}
