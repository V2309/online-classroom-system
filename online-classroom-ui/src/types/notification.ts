export interface NotificationActor {
  id: string;
  username: string;
  img?: string | null;
}

export interface NotificationItem {
  id: number;
  type: string;
  content?: string | null;
  link: string;
  isRead: boolean;
  createdAt: string;
  actor: NotificationActor;
}
