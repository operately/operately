defmodule OperatelyWeb.Graphql.Queries.Goals do
  use Absinthe.Schema.Notation

  alias Operately.Goals

  object :goal_queries do
    field :goals, list_of(:goal) do
      arg :space_id, :id

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        goals = if args[:space_id] do
          Goals.list_goals_for_space(person, args.space_id)
        else
          Goals.list_goals_for_company(person, person.company_id)
        end

        {:ok, goals}
      end
    end

    field :goal, non_null(:goal) do
      arg :id, non_null(:id)

      resolve fn _, args, _ ->
        goal = Operately.Goals.get_goal!(args.id)

        {:ok, goal}
      end
    end
  end
end
