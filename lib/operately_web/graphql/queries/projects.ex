defmodule OperatelyWeb.Graphql.Queries.Projects do
  use Absinthe.Schema.Notation

  input_object :project_list_filters do
    field :space_id, :id
    field :include_archived, :boolean
    field :filter, :string
  end

  object :project_queries do
    field :project, :project do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        project = Operately.Projects.get_project!(args.id)

        permissions = Operately.Projects.get_permissions(project, person)

        if permissions.can_view do
          {:ok, project}
        else
          {:ok, nil}
        end
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
