export type NotificationType = "New Request" | "Conflict";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  referenceId: string;
  referenceType: "Requisition" | "Conflict";
  isRead: boolean;
}