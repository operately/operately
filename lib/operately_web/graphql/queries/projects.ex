defmodule OperatelyWeb.Graphql.Queries.Projects do
  use Absinthe.Schema.Notation

  object :project_queries do
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
