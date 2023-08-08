defmodule OperatelyWeb.GraphQL.Mutations.Groups do
  use Absinthe.Schema.Notation

  object :group_mutations do
    field :create_group, :group do
      arg :name, non_null(:string)
      arg :mission, non_null(:string)

      resolve fn args, _ ->
        Operately.Groups.create_group(%{
          name: args.name,
          mission: args.mission
        })
      end
    end
  end
end
