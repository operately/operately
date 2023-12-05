defmodule OperatelyWeb.Graphql.Mutations.Goals do
  use Absinthe.Schema.Notation

  input_object :create_goal_input do
    field :space_id, non_null(:id)
    field :name, non_null(:string)
    field :champion_id, non_null(:id)
    field :reviewer_id, non_null(:id)
    field :year, non_null(:string)
    field :quarter, non_null(:string)
  end

  object :goal_mutations do
    field :create_goal, :goal do
      arg :input, non_null(:create_goal_input)

      resolve fn args, %{context: context} ->
        creator = context.current_account.person

        Operately.Goals.create_goal(creator, args.input)
      end
    end
  end
end
