import path from "node:path";
import { UsageError } from "../../../core/parser-types";
import type { CustomEndpointDeps, CustomEndpointExecutor } from "../types";

const CREATE_AVATAR_BLOB_PATH = "/create_avatar_blob";

interface CreateAvatarBlobResponse {
  blobs?: Array<{
    id?: string;
    url?: string;
    signed_upload_url?: string;
    upload_strategy?: string;
  }>;
}

interface GetMeResponse {
  me?: {
    id?: string;
  };
}

export const executePeopleUpdatePicture: CustomEndpointExecutor = async (input, deps) => {
  const avatarFile = readOptionalString(input.endpointInputs.avatar_file, "avatar_file");
  const clear = readOptionalBoolean(input.endpointInputs.clear, "clear");

  if (!!avatarFile === !!clear) {
    throw new UsageError("Specify exactly one of '--avatar-file <path>' or '--clear'.");
  }

  const getMeEndpoint = input.registry.find(["people", "get_me"]);
  if (!getMeEndpoint) {
    throw new Error("Endpoint 'people/get_me' is not present in the API catalog.");
  }

  const meResponse = (await deps.callEndpoint({
    endpoint: getMeEndpoint,
    baseUrl: input.runtime.baseUrl,
    token: input.runtime.token,
    inputs: {},
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  })) as GetMeResponse;

  const personId = meResponse.me?.id;
  if (!personId) {
    throw new Error("Failed to resolve the authenticated person for 'people/update_picture'.");
  }

  if (clear) {
    return deps.callExternalMutation({
      baseUrl: input.runtime.baseUrl,
      path: input.endpoint.path,
      inputs: {
        person_id: personId,
        avatar_blob_id: null,
        avatar_url: null,
      },
      token: input.runtime.token,
      timeoutMs: input.runtime.timeoutMs,
      verbose: input.globalFlags.verbose,
    });
  }

  if (!avatarFile) {
    throw new UsageError("Flag '--avatar-file' must be provided when '--clear' is not used.");
  }

  const fileBytes = readLocalFile(avatarFile, deps);
  const stat = readLocalFileStat(avatarFile, deps);
  const contentType = deps.inferMimeType(avatarFile);

  const blobResponse = (await deps.callExternalMutation({
    baseUrl: input.runtime.baseUrl,
    path: CREATE_AVATAR_BLOB_PATH,
    inputs: {
      files: [
        {
          filename: path.basename(avatarFile),
          size: stat.size,
          content_type: contentType,
        },
      ],
    },
    token: input.runtime.token,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  })) as CreateAvatarBlobResponse;

  const blob = blobResponse.blobs?.[0];
  if (!blob?.id || !blob.url || !blob.signed_upload_url || !blob.upload_strategy) {
    throw new Error("Failed to create avatar blob for upload.");
  }

  await deps.uploadToSignedUrl({
    filePath: avatarFile,
    fileBytes,
    signedUploadUrl: blob.signed_upload_url,
    uploadStrategy: blob.upload_strategy,
    contentType,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  });

  return deps.callExternalMutation({
    baseUrl: input.runtime.baseUrl,
    path: input.endpoint.path,
    inputs: {
      person_id: personId,
      avatar_blob_id: blob.id,
      avatar_url: blob.url,
    },
    token: input.runtime.token,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  });
};

export function inferMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  return (
    {
      ".avif": "image/avif",
      ".gif": "image/gif",
      ".heic": "image/heic",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
    }[extension] || "application/octet-stream"
  );
}

function readOptionalString(value: unknown, fieldName: string): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;
  throw new UsageError(`Field '${fieldName}' must be a string.`);
}

function readOptionalBoolean(value: unknown, fieldName: string): boolean {
  if (value === undefined) return false;
  if (typeof value === "boolean") return value;
  throw new UsageError(`Field '${fieldName}' must be a boolean.`);
}

function readLocalFile(filePath: string, deps: CustomEndpointDeps): Buffer {
  try {
    return deps.readFile(filePath);
  } catch (error) {
    throw new UsageError(
      `Failed to read file for '--avatar-file': ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readLocalFileStat(filePath: string, deps: CustomEndpointDeps) {
  try {
    return deps.statFile(filePath);
  } catch (error) {
    throw new UsageError(
      `Failed to inspect file for '--avatar-file': ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
