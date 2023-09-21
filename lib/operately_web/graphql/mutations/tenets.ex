defmodule OperatelyWeb.GraphQL.Mutations.Tenets do
  use Absinthe.Schema.Notation

  object :tenet_mutations do
    field :create_tenet, :tenet do
      arg :name, non_null(:string)
      arg :description, :string

      resolve fn args, _ ->
        Operately.Tenets.create_tenet(%{name: args.name, description: args[:description] || "-"})
      end
    end
  end
end
