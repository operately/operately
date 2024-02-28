defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectCheckInCommented do
  use Absinthe.Schema.Notation

  object :activity_content_project_check_in_commented do
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
      end
    end

    field :status_update_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["status_update_id"]}
      end
    end

    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :update, non_null(:update) do
      resolve fn activity, _, _ ->
        id = activity.content["status_update_id"]
        update = Operately.Updates.get_update!(id)

        {:ok, update}
      end
    end

    field :comment, non_null(:comment) do
      resolve fn activity, _, _ ->
        id = activity.content["comment_id"]

        {:ok, Operately.Updates.get_comment!(id)}
      end
    end
  end
end
