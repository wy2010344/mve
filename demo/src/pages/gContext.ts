import { createContext } from "mve-core";
import { Branch } from "mve-helper";
import { GetValue, memo, StoreRef } from "wy-helper";

export type ThemeType = "light" | "dark"
export const gContext = createContext<{
  renderBranch(get: GetValue<Branch>): void
  preLoad(v: string): void
  theme(): ThemeType
  toggleTheme(): void
  themeColors(): {
    bg: string;
    cardBg: string;
    text: string;
    textSecondary: string;
    border: string;
    hover: string;
    primary: string
  }
  getNotifications(): Notification[]
  addNotification(n: Omit<Notification, "id" | "timestamp">): void
}>(undefined!)



export interface Notification {
  id: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
}
