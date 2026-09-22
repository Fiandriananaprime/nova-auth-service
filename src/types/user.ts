import type { UserRole,UserStatus,AdminRole } from "@Fiandriananaprime/nova_api_type";

export type AuthMe = {
  userId: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  adminRole: AdminRole | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};
