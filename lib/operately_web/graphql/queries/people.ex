defmodule OperatelyWeb.Graphql.Queries.People do
  use Absinthe.Schema.Notation

  object :person_queries do
    field :person, :person do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        person = Operately.People.get_person!(args.id)

        {:ok, person}
      end
    end
  end
end
