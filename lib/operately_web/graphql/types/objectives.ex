defmodule OperatelyWeb.Graphql.Types.Objectives do
  use Absinthe.Schema.Notation

  object :objective do
    field :id, non_null(:id)
    field :name, non_null(:string)

    field :description, :string do
      resolve fn objective, _, _ ->
        {:ok, Jason.encode!(objective.description)}
      end
    end

    field :owner, :person do
      resolve fn objective, _, _ ->
        person = Operately.Okrs.get_owner!(objective)

        {:ok, person}
      end
    end

    field :key_results, list_of(:key_result) do
      resolve fn objective, _, _ ->
        key_results = Operately.Okrs.list_key_results!(objective.id)

        {:ok, key_results}
      end
    end

    field :group, :group do
      resolve fn objective, _, _ ->
        group = Operately.Groups.get_group(objective.group_id)

        {:ok, group}
      end
    end

    field :activities, list_of(:activity) do
      resolve fn objective, _, _ ->
        updates = Operately.Updates.list_updates(objective.id, :objective)

        {:ok, updates}
      end
    end

    field :projects, list_of(:project) do
      resolve fn objective, _, _ ->
        projects = Operately.Projects.list_projects(%{
          objective_id: objective.id
        })

        {:ok, projects}
      end
    end
  end

  input_object :create_objective_input do
    field :name, non_null(:string)
    field :description, :string
    field :timeframe, :string
    field :owner_id, :id
  end

end
