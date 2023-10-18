defmodule OperatelyWeb.Graphql.Types.Comments do
  use Absinthe.Schema.Notation

  object :comment do
    field :id, non_null(:id)
    field :inserted_at, non_null(:naive_datetime)

    field :message, non_null(:string) do
      resolve fn comment, _, _ ->
        {:ok, Jason.encode!(comment.content["message"])}
      end
    end

    field :author, :person do
      resolve fn comment, _, _ ->
        person = Operately.People.get_person!(comment.author_id)

        {:ok, person}
      end
    end

    field :reactions, list_of(:reaction) do
      resolve fn comment, _, _ ->
        reactions = Operately.Updates.list_reactions(comment.id, :comment)

        {:ok, reactions}
      end
    end
  end
end
