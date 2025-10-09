defmodule Operately.Data.Change081UpdateGroupEditedSpaceKey do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Changeset
  alias Operately.Repo
  alias __MODULE__.Activity

  def run do
    from(a in Activity, where: a.action == "group_edited")
    |> Repo.all()
    |> Enum.each(&maybe_update_activity/1)
  end

  defp maybe_update_activity(activity) do
    cond do
      Map.has_key?(activity.content, "group_id") ->
        group_id = activity.content["group_id"]

        activity.content
        |> Map.delete("group_id")
        |> Map.put("space_id", group_id)
        |> persist(activity)

      Map.has_key?(activity.content, :group_id) ->
        group_id = activity.content[:group_id]

        activity.content
        |> Map.delete(:group_id)
        |> Map.put(:space_id, group_id)
        |> persist(activity)

      true ->
        :ok
    end
  end

  defp persist(new_content, activity) do
    if new_content != activity.content do
      activity
      |> Changeset.change(%{content: new_content})
      |> Repo.update!()
    else
      :ok
    end
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :content, :map
    end
  end
end
