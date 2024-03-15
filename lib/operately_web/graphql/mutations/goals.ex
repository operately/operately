defmodule OperatelyWeb.Graphql.Mutations.Goals do
  use Absinthe.Schema.Notation

  input_object :create_goal_input do
    field :space_id, non_null(:id)
    field :name, non_null(:string)
    field :champion_id, non_null(:id)
    field :reviewer_id, non_null(:id)
    field :timeframe, non_null(:string)
    field :targets, non_null(list_of(:create_target_input))
    field :description, :string
  end

  input_object :edit_goal_input do
    field :goal_id, non_null(:id)
    field :name, non_null(:string)
    field :champion_id, non_null(:id)
    field :reviewer_id, non_null(:id)
    field :timeframe, non_null(:string)
    field :added_targets, non_null(list_of(:create_target_input))
    field :updated_targets, non_null(list_of(:update_target_input))
    field :description, :string
  end

  input_object :create_target_input do
    field :name, non_null(:string)
    field :from, non_null(:float)
    field :to, non_null(:float)
    field :unit, non_null(:string)
    field :index, non_null(:integer)
  end

  input_object :update_target_input do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :from, non_null(:float)
    field :to, non_null(:float)
    field :unit, non_null(:string)
    field :index, non_null(:integer)
  end

  input_object :change_goal_parent_input do
    field :goal_id, non_null(:string)
field :parent_goal_id, non_null(:string)
  end


  object :goal_mutations do
    field :change_goal_parent, non_null(:goal) do
      arg :input, non_null(:change_goal_parent_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person

        Operately.Operations.GoalReparent.run(author, input)
      end
    end

    field :create_goal, :goal do
      arg :input, non_null(:create_goal_input)

      resolve fn args, %{context: context} ->
        creator = context.current_account.person

        Operately.Operations.GoalCreation.run(creator, args.input)
      end
    end

    field :archive_goal, :goal do
      arg :goal_id, non_null(:id)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        goal = Operately.Goals.get_goal!(args.goal_id)

        Operately.Operations.GoalArchived.run(author, goal)
      end
    end

    field :edit_goal, :goal do
      arg :input, non_null(:edit_goal_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        goal = Operately.Goals.get_goal!(args.input.goal_id)

        Operately.Operations.GoalEditing.run(author, goal, args.input)
      end
    end
  end
end
