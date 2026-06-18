export const bayStatuses = ["Open", "Occupied", "Maintenance"] as const;
export type BayStatus = (typeof bayStatuses)[number];

export interface Bay {
  id: string;
  name: string;
  status: BayStatus;
}
