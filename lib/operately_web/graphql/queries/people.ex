defmodule OperatelyWeb.Graphql.Queries.People do
  use Absinthe.Schema.Notation

  object :person_queries do
    field :me, :person do
      resolve fn _, _, %{context: context} ->
        {:ok, context.current_account.person}
      end
    end

    field :people, list_of(:person) do
      resolve fn _, %{context: context} ->
        company_id = context.current_account.person.company_id

        {:ok, Operately.People.list_people(company_id)}
      end
    end

    field :person, :person do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        person = Operately.People.get_person!(args.id)

        {:ok, person}
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
end
