defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalTimeframeEditing do
  use Absinthe.Schema.Notation

  object :activity_content_goal_timeframe_editing do
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
    
  end
end
