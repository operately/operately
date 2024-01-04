defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalEditing do
  use Absinthe.Schema.Notation

  object :activity_content_goal_editing do
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
    
    
    field :old_name, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_name"]}
      end
    end
    
    
    field :new_name, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_name"]}
      end
    end
    
    
    field :old_timeframe, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_timeframe"]}
      end
    end
    
    
    field :new_timeframe, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_timeframe"]}
      end
    end
    
    
    field :old_champion_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_champion_id"]}
      end
    end
    
    
    field :new_champion_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_champion_id"]}
      end
    end
    
    
    field :old_reviewer_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_reviewer_id"]}
      end
    end
    
    
    field :new_reviewer_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_reviewer_id"]}
      end
    end
    
    
    field :added_targets, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["added_targets"]}
      end
    end
    
    
    field :updated_targets, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["updated_targets"]}
      end
    end
    
    
    field :removed_targets, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["removed_targets"]}
      end
    end
    
  end
end
