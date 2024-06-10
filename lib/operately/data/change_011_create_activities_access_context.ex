defmodule Operately.Data.Change011CreateActivitiesAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access

  def run do
    Repo.transaction(fn ->
      activities = Repo.all(from a in Operately.Activities.Activity, select: a.id)

      Enum.each(activities, fn activity_id ->
        case create_activitie_access_contexts(activity_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_activitie_access_contexts(activity_id) do
    Access.create_context(%{activity_id: activity_id})
  end
end
