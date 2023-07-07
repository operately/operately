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

    field :pins, list_of(:pin) do
      resolve fn _, %{context: context} ->
        person = context.current_account.person
        pins = Operately.People.list_people_pins(person.id)

        {:ok, pins}
      end
    end

  end

  object :pin do
    field :id, non_null(:id)
    field :person_id, non_null(:id)
    field :pinned_id, non_null(:id)
    field :pinned_type, non_null(:string)

    field :pinned, :pinned do
      resolve fn pin, _, _ ->
        project = Operately.Projects.get_project!(pin.pinned_id)

        {:ok, project}
      end
    end
  end

  union :pinned do
    types [:project]

    resolve_type fn
      %Operately.Projects.Project{}, _ -> :project
    end
  end
end
