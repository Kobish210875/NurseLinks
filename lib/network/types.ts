export type ConnectionStatus = "none" | "pending_out" | "pending_in" | "connected" | "blocked";

export type NetworkMember = {
  id: string;
  fullName: string;
  headline: string | null;
  workplaceInstitutionSlug: string | null;
  avatarUrl: string | null;
  initials: string;
  connectionStatus: ConnectionStatus;
  connectedAt: string | null;
  requesterId: string | null;
};

export type NetworkRecommendation = NetworkMember & {
  mutualCount: number;
};

export type MessageThread = {
  peerId: string;
  peerName: string;
  peerHeadline: string | null;
  peerAvatarUrl: string | null;
  peerInitials: string;
  lastMessageBody: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  isUnread: boolean;
};
