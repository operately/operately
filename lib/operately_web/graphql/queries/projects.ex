defmodule OperatelyWeb.GraphQL.Queries.Projects do
  use Absinthe.Schema.Notation

  object :project_queries do
    field :projects, list_of(:project) do
      arg :group_id, :id
      arg :group_member_roles, list_of(:string)
      arg :objective_id, :id

      resolve fn _, args, _ ->
        projects = Operately.Projects.list_projects(%{
          group_id: args[:group_id],
          group_member_roles: args[:group_member_roles],
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

    field :project_contributor_candidates, list_of(:person) do
      arg :project_id, non_null(:id)
      arg :query, non_null(:string)

      resolve fn _, args, _ ->
        candidates = Operately.Projects.list_project_contributor_candidates(
          args.project_id,
          args.query,
          [],
          10
        )

        {:ok, candidates}
      end
    end
  end
end
