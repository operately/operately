defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectDiscussionCommentSubmitted do
  use Absinthe.Schema.Notation

  object :activity_content_project_discussion_comment_submitted do
    field :space_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["space_id"]}
      end
    end

    field :discussion_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["discussion_id"]}
      end
    end

    field :title, non_null(:string) do
      resolve fn activity, _, _ ->
        discussion_id = activity.content["discussion_id"]
        discussion = Operately.Updates.get_update!(discussion_id)

        {:ok, discussion.content["title"]}
      end
    end

    field :space, non_null(:group) do
      resolve fn activity, _, _ ->
        space_id = activity.content["space_id"]

        space = Operately.Groups.get_group!(space_id)

        {:ok, space}
      end
    end
  end
end
