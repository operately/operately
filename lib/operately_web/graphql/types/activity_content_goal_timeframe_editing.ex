defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalTimeframeEditing do
  use Absinthe.Schema.Notation

  object :activity_content_goal_timeframe_editing do
    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        {:ok, Operately.Goals.get_goal!(activity.content["goal_id"])}
      end
    end

    field :old_timeframe, non_null(:timeframe) do
      resolve fn activity, _, _ ->
        {:ok, Operately.Goals.Timeframe.parse_json!(activity.content["old_timeframe"])}
      end
    end
    
    
    field :new_timeframe, non_null(:timeframe) do
      resolve fn activity, _, _ ->
        {:ok, Operately.Goals.Timeframe.parse_json!(activity.content["new_timeframe"])}
      end
    end
    
  end
end
