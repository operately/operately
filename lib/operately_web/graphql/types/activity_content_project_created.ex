defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectCreated do
  use Absinthe.Schema.Notation

  object :activity_content_project_created do
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
      end
    end

    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        content = Operately.Repo.preload(activity.content, :project)

        {:ok, content.project}
      end
    end
  end
end
