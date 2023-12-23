defmodule OperatelyWeb.Graphql.Types.UpdateContentGoalCheckIn do
  use Absinthe.Schema.Notation

  object :update_content_goal_check_in do
    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end
  end
end
