defmodule OperatelyWeb.Graphql.Types.Discussions do
  use Absinthe.Schema.Notation

  object :discussion do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)

    field :author, non_null(:person) do
      resolve fn discussion, _, _ ->
        author = Operately.People.get_person!(discussion.author_id)
        {:ok, author}
      end
    end

    field :title, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["title"]}
      end
    end

    field :body, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["body"])}
      end
    end

    field :space, non_null(:group) do
      resolve fn update, _, _ ->
        space = Operately.Groups.get_group!(update.updatable_id)
        {:ok, space}
      end
    end

    field :reactions, list_of(:reaction) do
      resolve fn update, _, _ ->
        reactions = Operately.Updates.list_reactions(update.id, :update)

        {:ok, reactions}
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
