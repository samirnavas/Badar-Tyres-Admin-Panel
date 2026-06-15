export type UserRole = "admin" | "agent" | "technician";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
}
