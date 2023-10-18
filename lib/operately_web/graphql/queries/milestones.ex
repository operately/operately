defmodule OperatelyWeb.Graphql.Queries.Milestones do
  use Absinthe.Schema.Notation

  object :milestone_queries do
    field :milestone, :milestone do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        milestone = Operately.Projects.get_milestone!(args.id)

        {:ok, milestone}
      end
    end
  end
end
