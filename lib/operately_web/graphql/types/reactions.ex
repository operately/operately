defmodule OperatelyWeb.Graphql.Types.Reactions do
  use Absinthe.Schema.Notation

  object :reaction do
    field :id, non_null(:id)
    field :emoji, non_null(:string)
    field :reaction_type, non_null(:string)

    field :person, non_null(:person) do
      resolve fn reaction, _, _ ->
        person = Operately.People.get_person!(reaction.person_id)
        {:ok, person}
      end
    end
  end
end
