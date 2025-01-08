defmodule Operately.Data.Change046UpdateFileCreatedActivityFormat do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    Repo.transaction(fn ->
      fetch_activities()
      |> update_activities()
    end)
  end

  defp fetch_activities do
    from(a in Activity, where: a.action == "resource_hub_file_created")
    |> Repo.all()
  end

  defp update_activities(activities) do
    Enum.each(activities, &update_activity/1)
  end

  defp update_activity(%{content: content} = activity) do
    node = fetch_node(content["file_id"])

    if node do
      {:ok, _} = Activity.changeset(activity, %{content: %{
        "company_id" => content["company_id"],
        "space_id" => content["space_id"],
        "resource_hub_id" => content["resource_hub_id"],
        "files" => [
          %{
            "file_id" => content["file_id"],
            "node_id" => node.id
          }
        ]
      }})
      |> Repo.update()
    end
  end

  defp fetch_node(nil), do: nil
  defp fetch_node(file_id) do
    from(n in Operately.ResourceHubs.Node,
      join: f in assoc(n, :file),
      where: f.id == ^file_id
    )
    |> Repo.one()
  end
end
