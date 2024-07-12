defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdate do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Goal
  alias Operately.Updates.Update

  inputs do
    field :id, :string
    field :include_goal, :boolean
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    update = Operately.Updates.get_update!(id)
    update = Operately.Repo.preload(update, [:author, :acknowledging_person, reactions: [:person]])

    if update do
      update = Update.preload_goal(update)
      update = load_goal_permissions(update, me(conn))

      {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
    else
      {:error, :not_found}
    end
  end

  defp load_goal_permissions(update, person) do
    goal = Goal.preload_permissions(update.goal, person)
    Map.put(update, :goal, goal)
  end
end
