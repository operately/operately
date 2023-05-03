defmodule OperatelyWeb.GraphQL.Mutations.Objectives do
  use Absinthe.Schema.Notation

  object :objective_mutations do
    field :create_objective, :objective do
      arg :input, non_null(:create_objective_input)

      resolve fn args, _ ->
        Operately.Okrs.create_objective(args.input)
      end
    end

    field :set_objective_owner, :objective do
      arg :id, non_null(:id)
      arg :owner_id, :id

      resolve fn args, _ ->
        Operately.Okrs.set_objective_owner(args.id, args.owner_id)
      end
    end

    field :set_goal_group, :objective do
      arg :id, non_null(:id)
      arg :group_id, :id

      resolve fn args, _ ->
        Operately.Okrs.set_goal_group(args.id, args.group_id)
      end
    end
  end
end
