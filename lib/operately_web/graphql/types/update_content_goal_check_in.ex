defmodule OperatelyWeb.Graphql.Types.UpdateContentGoalCheckIn do
  use Absinthe.Schema.Notation

  object :update_content_goal_check_in_target do
    field :id, non_null(:string) do
      resolve fn target, _, _ ->
        {:ok, target["id"]}
      end
    end

    field :name, non_null(:string) do
      resolve fn target, _, _ ->
        {:ok, target["name"]}
      end
    end

    field :value, non_null(:float) do
      resolve fn target, _, _ ->
        {:ok, target["value"]}
      end
    end

    field :unit, non_null(:string) do
      resolve fn target, _, _ ->
        {:ok, target["unit"]}
      end
    end

    field :previous_value, non_null(:float) do
      resolve fn target, _, _ ->
        {:ok, target["previous_value"]}
      end
    end

    field :index, non_null(:integer) do
      resolve fn target, _, _ ->
        {:ok, target["index"]}
      end
    end

    field :from, :float do
      resolve fn target, _, _ ->
        {:ok, target["from"]}
      end
    end

    field :to, non_null(:float) do
      resolve fn target, _, _ ->
        {:ok, target["to"]}
      end
    end
  end

  object :update_content_goal_check_in do
    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end

    field :targets, list_of(:update_content_goal_check_in_target) do
      resolve fn update, _, _ ->
        targets = 
          (update.content["targets"] || []) 
          |> Enum.filter(fn target -> target["id"] != nil && target["from"] != nil end)

        {:ok, targets}
      end
    end 
  end
end
