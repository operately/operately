defmodule Operately.Data.Change086DeleteDuplicateTaskMilestoneUpdatingActivities do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Activity

  def run do
    Repo.transaction(fn ->
      fetch_activities()
      |> collect_duplicate_ids()
      |> delete_activities()
    end)
  end

  defp fetch_activities do
    from(a in Activity, where: a.action == "task_milestone_updating")
    |> Repo.all()
  end

  defp collect_duplicate_ids(activities) do
    activities
    |> Enum.filter(&milestone_ids_same?/1)
    |> Enum.map(& &1.id)
  end

  defp milestone_ids_same?(activity) do
    {old_id, old_present?} = fetch_old_milestone_id(activity.content)
    {new_id, new_present?} = fetch_new_milestone_id(activity.content)

    old_present? and new_present? and old_id == new_id
  end

  defp fetch_old_milestone_id(content) do
    fetch_milestone_id(content, "old_milestone_id", :old_milestone_id)
  end

  defp fetch_new_milestone_id(content) do
    fetch_milestone_id(content, "new_milestone_id", :new_milestone_id)
  end

  defp fetch_milestone_id(content, string_key, atom_key) do
    cond do
      Map.has_key?(content, string_key) -> {Map.get(content, string_key), true}
      Map.has_key?(content, atom_key) -> {Map.get(content, atom_key), true}
      true -> {nil, false}
    end
  end

  defp delete_activities([]), do: :ok

  defp delete_activities(ids) do
    from(a in Activity, where: a.id in ^ids)
    |> Repo.delete_all()

    :ok
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :content, :map
    end
  end
end
