defmodule Operately.Data.Change040AddStatusValueForExistingGoalUpdates do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      {_, nil} = from(u in "goal_updates", where: is_nil(u.status))
      |> Repo.update_all(set: [
        status: "on_track"
      ])
    end)
  end
end
