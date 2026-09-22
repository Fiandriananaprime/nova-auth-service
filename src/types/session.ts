export interface Session {
  id: string;
  device: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  location: string | null;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
};