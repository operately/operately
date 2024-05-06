defmodule OperatelyWeb.Graphql.Types.ActivityContentCommentAdded do
  use Absinthe.Schema.Notation

  object :activity_content_comment_added do
    field :comment, non_null(:comment) do
      resolve fn activity, _, _ ->
        id = activity.content["comment_id"]

        {:ok, Operately.Updates.get_comment!(id)}
      end
    end

    field :activity, :activity do
      resolve fn activity, _, _ ->
        id = activity.content["activity_id"]

        if id do
          {:ok, Operately.Activities.get_activity!(id)}
        else
          {:ok, nil}
        end
      end
    end
  end
end
