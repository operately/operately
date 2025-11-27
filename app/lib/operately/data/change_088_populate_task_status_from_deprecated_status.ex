defmodule Operately.Data.Change088PopulateTaskStatusFromDeprecatedStatus do
  @moduledoc """
  Populates the new task_status embed based on the deprecated status field.
  Tasks that already have task_status populated are left unchanged.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Task

  def run do
    Repo.transaction(fn ->
      fetch_tasks_without_task_status()
      |> Enum.each(&update_task_status/1)
    end)
  end

  defp fetch_tasks_without_task_status do
    from(t in Task, where: is_nil(t.task_status))
    |> Repo.all()
  end

  defp update_task_status(task) do
    status = task.status || "pending"

    {:ok, _} =
      task
      |> Task.changeset(%{task_status: build_task_status(status)})
      |> Repo.update()
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
      "canceled" => %{label: "Canceled", color: :red, index: 7, closed: true},
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

  defmodule Task do
    use Operately.Schema

    schema "tasks" do
      field :status, :string
      embeds_one :task_status, Operately.Projects.TaskStatus, on_replace: :update

      timestamps()
    end

    def changeset(task, attrs) do
      task
      |> Ecto.Changeset.cast(attrs, [:status])
      |> Ecto.Changeset.cast_embed(:task_status)
    end
  end
end
