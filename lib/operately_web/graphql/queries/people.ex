defmodule OperatelyWeb.GraphQL.Queries.People do
  use Absinthe.Schema.Notation

  object :people_queries do

    field :me, :person do
      resolve fn _, _, %{context: context} ->
        {:ok, context.current_account.person}
      end
    end

    field :person, :person do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        person = Operately.People.get_person!(args.id)

        {:ok, person}
      end
    end

    field :search_people, list_of(:person) do
      arg :query, non_null(:string)

      resolve fn args, _ ->
        people = Operately.People.search_people(args.query)

        {:ok, people}
      end
    end

    field :home_dashboard, non_null(:dashboard) do
      resolve fn _, %{context: context} ->
        person = context.current_account.person
        {:ok, dashboard} = Operately.People.find_or_create_home_dashboard(person)
        dashboard = Operately.Repo.preload(dashboard, [:panels])

        {:ok, dashboard}
      end
    end
  end

  object :dashboard do
    field :id, non_null(:id)
    field :panels, list_of(:panel)
  end

  object :panel do
    field :id, non_null(:id)
    field :type, non_null(:string)
    field :index, non_null(:integer)

    field :linked_resource, :panel_linked_resource do
      resolve fn resource, _, _ ->
        if resource.linked_resource_id == nil do
          {:ok, nil}
        else
          project = Operately.Projects.get_project!(resource.linked_resource_id)

          {:ok, project}
        end
      end
    end
  end

  union :panel_linked_resource do
    types [:project]

    resolve_type fn
      %Operately.Projects.Project{}, _ -> :project
    end
  end
end
