defmodule OperatelyWeb.Graphql.Types.CommentThreads do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :comment_thread do
    field :id, non_null(:id)
    json_field :message, non_null(:string)
    assoc_field :reactions, non_null(list_of(:reaction))
    assoc_field :comments, non_null(list_of(:comment))
  end
end
