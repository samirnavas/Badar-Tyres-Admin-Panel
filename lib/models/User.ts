export type UserRole =
  | "Admin"
  | "Manager"
  | "Supervisor"
  | "Team Lead"
  | "Technician"
  | "Sales";

export interface User {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  email: string;
  phone: string;
}
