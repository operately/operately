import Api from "@/api";

export type { AccessOptions, AccessOptionsInt, AccessLevels } from "@/api";
export const useGrantResourceAccess = Api.companies.useGrantResourceAccess;
