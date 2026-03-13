import Api from "@/api";

export type { Discussion } from "@/api";

export const getDiscussion = Api.space_discussions.get;
export const getDiscussions = Api.space_discussions.list;
export const usePostDiscussion = Api.space_discussions.useCreate;
export const usePublishDiscussion = Api.space_discussions.usePublish;
export const useEditDiscussion = Api.space_discussions.useUpdate;
export const useArchiveMessage = Api.space_discussions.useArchive;
