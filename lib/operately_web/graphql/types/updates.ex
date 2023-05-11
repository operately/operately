defmodule OperatelyWeb.GraphQL.Types.Updates do
  use Absinthe.Schema.Notation

  object :update do
    field :id, non_null(:id)
    field :content, non_null(:string)
    field :updateable_id, non_null(:id)
    field :inserted_at, non_null(:naive_datetime)

    field :author, :person do
      resolve fn update, _, _ ->
        person = Operately.People.get_person!(update.author_id)

        {:ok, person}
      end
    end

    field :comments, list_of(:comment) do
      resolve fn update, _, _ ->
        comments = Operately.Updates.list_comments(update.id)

        {:ok, comments}
      end
    end
  end
end
