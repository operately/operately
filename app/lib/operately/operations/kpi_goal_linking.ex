defmodule Operately.Operations.KpiGoalLinking do
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Kpis.Kpi

  def run(author, kpi, goal, linked) do
    Multi.new()
    |> Multi.one(:kpi, from(k in Kpi, where: k.id == ^kpi.id, lock: "FOR UPDATE"))
    |> Multi.merge(fn %{kpi: current} -> change_link(current, goal.id, linked, author) end)
    |> Repo.transaction()
    |> case do
      {:ok, _} -> :ok
      {:error, :link, %Ecto.Changeset{errors: [goal_id: _]}, _} -> {:error, :not_found}
      {:error, _, reason, _} -> {:error, reason}
    end
  end

  defp change_link(nil, _, _, _), do: Multi.error(Multi.new(), :link, :not_found)

  defp change_link(kpi, goal_id, linked, author) do
    cond do
      linked and is_nil(kpi.goal_id) -> update_link(kpi, goal_id, true, author)
      not linked and kpi.goal_id == goal_id -> update_link(kpi, goal_id, false, author)
      linked and kpi.goal_id != goal_id -> Multi.error(Multi.new(), :link, :bad_request)
      true -> Multi.new()
    end
  end

  defp update_link(kpi, goal_id, linked, author) do
    changeset =
      kpi
      |> Ecto.Changeset.change(goal_id: if(linked, do: goal_id))
      |> Ecto.Changeset.foreign_key_constraint(:goal_id)

    content = %{
      company_id: author.company_id,
      space_id: kpi.space_id,
      kpi_id: kpi.id,
      kpi_name: kpi.name,
      linked_goal_id: goal_id,
      linked: linked
    }

    Multi.new()
    |> Multi.update(:link, changeset)
    |> Activities.insert_sync(author.id, :kpi_goal_link_changed, fn _ -> content end, include_notification: false)
  end
end
