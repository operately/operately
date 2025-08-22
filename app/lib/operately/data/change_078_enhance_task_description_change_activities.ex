defmodule Operately.Data.Change078EnhanceTaskDescriptionChangeActivities do
  import Ecto.Query, only: [from: 2]
  alias Operately.{Repo, Tasks}
  alias Operately.Tasks.Task
  alias __MODULE__.Activity

  def run do
    from(a in Activity, where: a.action == "task_description_change")
    |> Repo.all()
    |> Enum.each(fn activity ->
      task_id = activity.content["task_id"]

      has_description = case get_task(task_id) do
        nil -> false
        task -> Tasks.has_description?(task)
      end

      new_content = activity.content
      |> Map.put("has_description", has_description)

      {:ok, _updated} = update_activity(activity, new_content)
    end)
  end

  defp get_task(nil), do: nil
  defp get_task(task_id) do
    Repo.get(Task, task_id)
  end

  defp update_activity(activity, new_content) do
    activity
    |> Ecto.Changeset.change(%{content: new_content})
    |> Repo.update()
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :content, :map
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(activity, attrs) do
      activity |> cast(attrs, [:action, :content])
    end
  end
end
