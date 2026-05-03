export interface AlbumRoleResponse {
  id: string;
  albumId: string;
  name: string;
  permissions: { id: string; name: string; code: string; type: string }[];
}
