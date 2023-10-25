defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectRenamed do
  use Absinthe.Schema.Notation

  object :activity_content_project_renamed do
    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :old_name, non_null(:string) do
      resolve fn activity, _, _ ->
        old_name = activity.content["old_name"]

        {:ok, old_name}
      end
    end

    field :new_name, non_null(:string) do
      resolve fn activity, _, _ ->
        new_name = activity.content["new_name"]

        {:ok, new_name}
      end
    end
  end
end
