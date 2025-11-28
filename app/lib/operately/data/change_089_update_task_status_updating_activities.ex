defmodule Operately.Data.Change089UpdateTaskStatusUpdatingActivities do
  @moduledoc """
  Backfill existing task_status_updating activities so that old_status and new_status
  use the new embedded Operately.Projects.TaskStatus structure instead of legacy strings.

  - If either old_status or new_status is nil/missing, the activity is deleted.
  - If old_status or new_status is a string, it is converted to a status map using
    the same mapping as Change088PopulateTaskStatusFromDeprecatedStatus.
  - If both are already maps, the activity is left unchanged.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Activity

  def run do
    Repo.transaction(fn ->
      fetch_activities()
      |> Enum.each(&process_activity/1)
    end)
  end

  defp fetch_activities do
    from(a in Activity, where: a.action == "task_status_updating")
    |> Repo.all()
  end

  defp process_activity(activity) do
    content = activity.content || %{}

    old_status = Map.get(content, "old_status")
    new_status = Map.get(content, "new_status")

    cond do
      is_nil(old_status) or is_nil(new_status) ->
        Repo.delete!(activity)

      is_binary(old_status) or is_binary(new_status) ->
        updated_content =
          content
          |> maybe_put_status("old_status", old_status)
          |> maybe_put_status("new_status", new_status)

        activity
        |> Activity.changeset(%{content: updated_content})
        |> Repo.update!()

      true ->
        :ok
    end
  end

  defp maybe_put_status(content, _key, value) when not is_binary(value), do: content

  defp maybe_put_status(content, key, value) when is_binary(value) do
    Map.put(content, key, build_task_status(value))
  end

  defp build_task_status(status) do
    attrs = status_attributes(status)

    %{
      id: Ecto.UUID.generate(),
      label: attrs.label,
      color: attrs.color,
      value: attrs.value,
      index: attrs.index,
      closed: attrs.closed
    }
  end

  defp status_attributes(status) do
    value = status || "pending"

    %{
      "not_started" => %{label: "Not started", color: :gray, index: 0, closed: false},
      "todo" => %{label: "Todo", color: :gray, index: 1, closed: false},
      "pending" => %{label: "Pending", color: :gray, index: 2, closed: false},
      "in_progress" => %{label: "In progress", color: :blue, index: 3, closed: false},
      "open" => %{label: "Open", color: :blue, index: 4, closed: false},
      "done" => %{label: "Done", color: :green, index: 5, closed: true},
      "completed" => %{label: "Completed", color: :green, index: 6, closed: true},
      "canceled" => %{label: "Canceled", color: :red, index: 7, closed: true}
    }
    |> Map.get(value, default_attributes(value))
    |> Map.put(:value, value)
  end

  defp default_attributes(value) do
    %{
      label: humanize(value),
      color: :gray,
      index: 0,
      closed: false
    }
  end

  defp humanize(value) do
    value
    |> to_string()
    |> String.replace("_", " ")
    |> String.capitalize()
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :content, :map
    end

    def changeset(activity, attrs) do
      activity
      |> Ecto.Changeset.cast(attrs, [:content])
    end
  end
end
