defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalCheckInEdit do
  use Absinthe.Schema.Notation

  object :activity_content_goal_check_in_edit do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    
    field :goal_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["goal_id"]}
      end
    end
    
    
    field :check_in_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["check_in_id"]}
      end
    end
    
  end
end
