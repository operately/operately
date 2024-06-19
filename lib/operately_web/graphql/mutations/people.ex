defmodule OperatelyWeb.Graphql.Mutations.People do
  use Absinthe.Schema.Notation

  object :person_mutations do
    field :create_profile, :person do
      arg :full_name, non_null(:string)
      arg :title, non_null(:string)
      arg :timezone, non_null(:string)
      arg :avatar_url, non_null(:string)
      arg :avatar_blob_id, :id

      resolve fn _, args, _ ->
        Operately.People.create_person(args)
      end
    end
  end
end
