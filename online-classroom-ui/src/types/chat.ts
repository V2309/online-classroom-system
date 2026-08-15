export interface ChatUser {
  id: string;
  username: string;
  img: string | null;
}

export interface ChatReplyTo {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    img: string | null;
  };
}

export interface ChatGroupMessage {
  id: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  pinnedAt?: string;
  replyTo?: ChatReplyTo;
  user: ChatUser;
}

export interface ClassMember {
  id: string;
  username: string;
  img: string | null;
  isOnline: boolean;
  role: 'student' | 'teacher';
}

export interface InitialChatDataResponse {
  messages: ChatGroupMessage[];
  allMembers: ClassMember[];
}

export interface SendMessageRequest {
  content: string;
  classCode: string;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      username: string;
      img: string | null;
    };
  };
}
