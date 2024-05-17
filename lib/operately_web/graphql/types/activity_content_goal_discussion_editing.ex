defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalDiscussionEditing do
  use Absinthe.Schema.Notation

  object :activity_content_goal_discussion_editing do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    
    field :space_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["space_id"]}
      end
    end
    
    
    field :goal_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["goal_id"]}
      end
    end
    
    
    field :activity_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["activity_id"]}
      end
    end
    
  end
end
