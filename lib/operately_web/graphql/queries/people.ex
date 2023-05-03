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

  end
end
