defmodule OperatelyWeb.GraphQL.Queries.Projects do
  use Absinthe.Schema.Notation

  object :project_queries do
    field :projects, list_of(:project) do
      arg :group_id, :id
      arg :objective_id, :id

      resolve fn _, args, _ ->
        projects = Operately.Projects.list_projects(%{
          group_id: args[:group_id],
          objective_id: args[:objective_id]
        })

        {:ok, projects}
      end
    end

    field :project, :project do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        project = Operately.Projects.get_project!(args.id)

        {:ok, project}
      end
    end
  end
end
