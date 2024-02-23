defmodule OperatelyWeb.Graphql.Queries.Comments do
  use Absinthe.Schema.Notation

  object :comment_queries do
    field :comments, list_of(:comment) do
      arg :entity_id, :id
      arg :entity_type, :string

      resolve fn _, args, _ ->
        type = String.to_existing_atom(args.entity_type)
        comments = Operately.Updates.list_comments(args.entity_id, type)

        {:ok, comments}
      end
    end
  end
end
