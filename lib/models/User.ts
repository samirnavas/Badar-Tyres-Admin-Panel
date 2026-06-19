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
  role: UserRole;
  email: string;
  phone: string;
}
