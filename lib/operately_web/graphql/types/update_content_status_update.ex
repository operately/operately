defmodule OperatelyWeb.Graphql.Types.UpdateContentStatusUpdate do
  use Absinthe.Schema.Notation

  object :update_content_status_update do
    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end

    field :old_health, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["old_health"] || ""}
      end
    end

    field :new_health, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["new_health"] || ""}
      end
    end

    field :next_milestone_id, :id do
      resolve fn update, _, _ ->
        {:ok, update.content["next_milestone_id"]}
      end
    end

    field :next_milestone_title, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["next_milestone_title"]}
      end
    end

    field :next_milestone_due_date, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["next_milestone_due_date"]}
      end
    end

    field :phase, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["phase"]}
      end
    end

    field :phase_start, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["phase_start"]}
      end
    end

    field :phase_end, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["phase_end"]}
      end
    end

    field :project_start_time, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["project_start_time"]}
      end
    end

    field :project_end_time, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["project_end_time"]}
      end
    end
  end
end
