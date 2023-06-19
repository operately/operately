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

    field :add_project_contributor, non_null(:project_contributor) do
      arg :project_id, non_null(:id)
      arg :person_id, non_null(:id)
      arg :responsibility, non_null(:string)
      arg :role, non_null(:string)

      resolve fn args, _ ->
        Operately.Projects.create_contributor(%{
          project_id: args.project_id,
          person_id: args.person_id,
          responsibility: args.responsibility,
          role: args.role
        })
      end
    end

    field :update_project_contributor, non_null(:project_contributor) do
      arg :contrib_id, non_null(:id)
      arg :person_id, non_null(:id)
      arg :responsibility, non_null(:string)

      resolve fn args, _ ->
        contrib = Operately.Projects.get_contributor!(args.contrib_id)

        Operately.Projects.update_contributor(contrib, %{
          person_id: args.person_id,
          responsibility: args.responsibility
        })
      end
    end

    field :remove_project_contributor, non_null(:project_contributor) do
      arg :contrib_id, non_null(:id)

      resolve fn args, _ ->
        contrib = Operately.Projects.get_contributor!(args.contrib_id)

        Operately.Projects.delete_contributor(contrib)
      end
    end
  end
end
