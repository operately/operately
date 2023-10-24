defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectArchived do
  use Absinthe.Schema.Notation

  object :activity_content_project_archived do
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
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
