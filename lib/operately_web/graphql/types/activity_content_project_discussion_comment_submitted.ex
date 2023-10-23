defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectDiscussionCommentSubmitted do
  use Absinthe.Schema.Notation

  object :activity_content_project_discussion_comment_submitted do
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
      end
    end

    field :discussion_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["discussion_id"]}
      end
    end

    field :discussion_title, non_null(:string) do
      resolve fn activity, _, _ ->
        discussion_id = activity.content["discussion_id"]
        discussion = Operately.Updates.get_update!(discussion_id)

        {:ok, discussion.content["title"]}
      end
    end

    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end
  end
end
