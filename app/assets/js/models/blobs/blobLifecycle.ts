import Api, {
  type CreateBlobInput,
  type CreateAvatarBlobInput,
  type CompanyTransfersCreateImportArtifactBlobsInput,
  type MarkBlobUploadedInput,
} from "@/api";
import { queryClient } from "@/api/queryClient";
import type { MutationOptions } from "@tanstack/react-query";

// Uploads also run outside React. Execute each API write as a TanStack mutation
// without changing the uploader's public interface or retrying blob creation.
function executeBlobMutation<TData, TVariables>(options: MutationOptions<TData, Error, TVariables>, input: TVariables) {
  return queryClient
    .getMutationCache()
    .build(queryClient, { ...options, retry: false, gcTime: 0 })
    .execute(input);
}

export function createFileBlobs(input: CreateBlobInput) {
  return executeBlobMutation(Api.createBlobMutationOptions(), input);
}
export function createAvatarBlobs(input: CreateAvatarBlobInput) {
  return executeBlobMutation(Api.createAvatarBlobMutationOptions(), input);
}
export function createImportArtifactBlobs(input: CompanyTransfersCreateImportArtifactBlobsInput) {
  return executeBlobMutation(Api.company_transfers.createImportArtifactBlobsMutationOptions(), input);
}
export function confirmBlobUpload(input: MarkBlobUploadedInput) {
  return executeBlobMutation(Api.markBlobUploadedMutationOptions(), input);
}
