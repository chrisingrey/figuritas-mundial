export interface Permission {
  id: string;
  name: string;
  code: string;
  type: "album" | "back-office";
}
