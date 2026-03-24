import Api from "@/api";

export type { Discussion } from "@/api";

export const getDiscussion = Api.spaces.getDiscussion;
export const getDiscussions = Api.spaces.listDiscussions;
export const usePostDiscussion = Api.spaces.useCreateDiscussion;
export const usePublishDiscussion = Api.spaces.usePublishDiscussion;
export const useEditDiscussion = Api.spaces.useUpdateDiscussion;
export const useArchiveMessage = Api.spaces.useArchiveDiscussion;
