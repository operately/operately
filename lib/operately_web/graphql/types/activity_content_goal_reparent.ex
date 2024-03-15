defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalReparent do
  use Absinthe.Schema.Notation

  object :activity_content_goal_reparent do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    
    field :old_parent_goal_id, :string do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_parent_goal_id"]}
      end
    end
    
    field :new_parent_goal_id, :string do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_parent_goal_id"]}
      end
    end
  end
end
