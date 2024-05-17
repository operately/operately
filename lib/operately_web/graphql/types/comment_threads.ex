defmodule OperatelyWeb.Graphql.Types.CommentThreads do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :comment_thread do
    field :id, non_null(:id)
    field :inserted_at, non_null(:date)
    field :title, :string

    json_field :message, non_null(:string)
    assoc_field :reactions, non_null(list_of(:reaction))
    assoc_field :comments, non_null(list_of(:comment))

    field :comments_count, non_null(:integer) do
      resolve fn comment_thread, _, _ ->
        import Ecto.Query

        query = (from  c in Operately.Updates.Comment,
                  where: c.entity_type == :comment_thread,
                  where: c.entity_id == ^comment_thread.id,
                  select: count(c.id))

        {:ok, Operately.Repo.one(query)}
      end
    end

    field :author, non_null(:person) do
      resolve fn comment_thread, _, _ ->
        if comment_thread.parent_type == :activity do
          activity = Operately.Activities.get_activity!(comment_thread.parent_id)
          person = Operately.Repo.preload(activity, :author).author

          {:ok, person}
        else
          raise "Unknown parent type: #{comment_thread.parent_type}"
        end
      end
    end
  end
end
