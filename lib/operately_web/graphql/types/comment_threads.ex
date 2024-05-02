defmodule OperatelyWeb.Graphql.Types.CommentThreads do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :comment_thread do
    field :id, non_null(:id)
    json_field :message, non_null(:string)
  end
end
