defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalEditing do
  use Absinthe.Schema.Notation

  object :activity_content_goal_editing do
    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        goal = Operately.Goals.get_goal!(activity.content["goal_id"])

        {:ok, goal}
      end
    end

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
    
    field :old_timeframe, non_null(:timeframe) do
      resolve fn activity, _, _ ->
        if activity.content["previous_timeframe"] do
          {:ok, activity.content["previous_timeframe"]}
        else
          {:ok, Operately.Goals.Timeframe.convert_old_timeframe(activity.content["old_timeframe"])}
        end
      end
    end
    
    field :new_timeframe, non_null(:timeframe) do
      resolve fn activity, _, _ ->
        if activity.content["current_timeframe"] do
          {:ok, activity.content["current_timeframe"]}
        else
          {:ok, Operately.Goals.Timeframe.convert_old_timeframe(activity.content["new_timeframe"])}
        end
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

    field :new_champion, non_null(:person) do
      resolve fn activity, _, _ ->
        person = Operately.People.get_person!(activity.content["new_champion_id"])

        {:ok, person}
      end
    end

    field :new_reviewer, non_null(:person) do
      resolve fn activity, _, _ ->
        person = Operately.People.get_person!(activity.content["new_reviewer_id"])

        {:ok, person}
      end
    end

    field :added_targets, non_null(list_of(:target)) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["added_targets"]}
      end
    end

    field :updated_targets, non_null(list_of(:goal_editing_updated_target)) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["updated_targets"]}
      end
    end

    field :deleted_targets, non_null(list_of(:target)) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["deleted_targets"]}
      end
    end
  end

  object :goal_editing_updated_target do
    field :id, non_null(:string)
    field :old_name, non_null(:string)
    field :new_name, non_null(:string)
  end
end
