defmodule OperatelyWeb.GraphQL.Mutations.Projects do
  use Absinthe.Schema.Notation

  object :project_mutations do
    field :create_project, :project do
      arg :name, non_null(:string)
      arg :description, :string

      resolve fn args, _ ->
        Operately.Projects.create_project(%{name: args.name, description: args[:description] || "-"})
      end
    end
  end
end
