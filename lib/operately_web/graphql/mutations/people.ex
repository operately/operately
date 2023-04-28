defmodule OperatelyWeb.GraphQL.Mutations.People do
  use Absinthe.Schema.Notation

  object :people_mutations do
    field :create_profile, :person do
      arg :full_name, non_null(:string)
      arg :title, non_null(:string)

      resolve fn _, args, _ ->
        Operately.People.create_person(args)
      end
    end
  end
end
