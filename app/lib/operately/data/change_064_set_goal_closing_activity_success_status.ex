defmodule Operately.Data.Change064SetGoalClosingActivitySuccessStatus do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    from(a in Activity,
      where: a.action == "goal_closing"
    )
    |> Repo.all()
    |> Enum.each(fn activity ->
      update_success_status(activity)
    end)
  end

  defp update_success_status(activity) do
    success_status = if activity.content["success"] == "no", do: :missed, else: :achieved

    activity
    |> Ecto.Changeset.change(%{
      content: Map.put(activity.content, "success_status", success_status)
    })
    |> Repo.update!()
  end
end
