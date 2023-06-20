defmodule OperatelyWeb.GraphQL.Types.Milestones do
  use Absinthe.Schema.Notation

  object :milestone do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :deadline_at, :date
    field :status, non_null(:string)
  end
end
