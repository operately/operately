defmodule OperatelyWeb.Graphql.Queries.Goals do
  use Absinthe.Schema.Notation

  object :goal_queries do
    field :goals, list_of(:project) do
      arg :space_id, non_null(:id)

      # resolve fn _, args, %{context: context} ->
      #   person = context.current_account.person
      #   goals = Operately.Goals.list_goals_for_space(person, args.space_id)

      #   {:ok, goals}
      # end
    end
  end
end
