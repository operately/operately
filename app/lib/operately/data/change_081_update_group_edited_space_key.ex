defmodule Operately.Data.Change081UpdateGroupEditedSpaceKey do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Changeset
  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    from(a in Activity, where: a.action == "group_edited")
    |> Repo.all()
    |> Enum.each(&maybe_update_activity/1)
  end

  defp maybe_update_activity(%Activity{} = activity) do
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

  defp persist(new_content, %Activity{} = activity) do
    if new_content != activity.content do
      activity
      |> Changeset.change(%{content: new_content})
      |> Repo.update!()
    else
      :ok
    end
  end
end
