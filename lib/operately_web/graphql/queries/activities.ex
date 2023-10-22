defmodule OperatelyWeb.Graphql.Queries.Activities do
  use Absinthe.Schema.Notation

  object :activity_queries do
    field :activities, list_of(:activity) do
      arg :scope_type, non_null(:string)
      arg :scope_id, non_null(:id)

      resolve fn _, args, _ ->
        raise "Not implemented"
      end
    end
  end
end
