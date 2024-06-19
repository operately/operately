defmodule OperatelyWeb.Graphql.Queries.People do
  use Absinthe.Schema.Notation

  object :person_queries do
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
  end
end
