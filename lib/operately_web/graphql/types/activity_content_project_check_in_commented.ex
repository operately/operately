defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectCheckInCommented do
  use Absinthe.Schema.Notation

  object :activity_content_project_check_in_commented do
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
      end
    end

    field :check_in_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["check_in_id"]}
      end
    end

    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :check_in, non_null(:project_check_in) do
      resolve fn activity, _, _ ->
        id = activity.content["check_in_id"]
        check_in = Operately.Projects.get_check_in!(id)

        {:ok, check_in}
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
