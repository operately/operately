defmodule OperatelyWeb.Graphql.Mutations.Goals do
  use Absinthe.Schema.Notation

  input_object :create_target_input do
    field :name, non_null(:string)
    field :from, non_null(:float)
    field :to, non_null(:float)
    field :unit, non_null(:string)
  end

  input_object :create_goal_input do
    field :space_id, non_null(:id)
    field :name, non_null(:string)
    field :champion_id, non_null(:id)
    field :reviewer_id, non_null(:id)
    field :timeframe, non_null(:string)
    field :targets, non_null(list_of(:create_target_input))
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
