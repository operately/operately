defmodule OperatelyWeb.Graphql.Queries.Goals do
  use Absinthe.Schema.Notation

  object :goal_queries do
    field :goals, list_of(:goal) do
      arg :space_id, :id
      arg :timeframe, :string
      arg :include_longer_timeframes, :boolean

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person
        goals = Operately.Goals.list_goals(%{company_id: person.company_id, space_id: args[:space_id]})

        {:ok, goals}
      end
    end

    field :goal, non_null(:goal) do
      arg :id, non_null(:id)

      resolve fn _, args, _ ->
        {:ok, Operately.Goals.get_goal!(args.id)}
      end
    end
  end
end
