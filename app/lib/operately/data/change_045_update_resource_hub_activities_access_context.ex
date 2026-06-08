defmodule Operately.Data.Change045UpdateResourceHubActivitiesAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{AccessContext, Activity}

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :content, :map
      field :access_context_id, :binary_id

      timestamps()
    end

    def changeset(activity, attrs) do
      activity
      |> cast(attrs, [:access_context_id])
      |> validate_required([:access_context_id])
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :group_id, :binary_id
    end
  end

  def run do
    Repo.transaction(fn ->
      fetch_activities()
      |> update_context()
    end)
  end

  defp fetch_activities do
    from(a in Activity, where: not is_nil(a.content["resource_hub_id"]))
    |> Repo.all()
  end

  defp update_context(activities) do
    Enum.each(activities, fn activity ->
      context = fetch_context(activity)

      {:ok, _} =
        Activity.changeset(activity, %{access_context_id: context.id})
        |> Repo.update()
    end)
  end

  defp fetch_context(activity) do
    from(c in AccessContext,
      where: c.group_id == ^activity.content["space_id"]
    )
    |> Repo.one!()
  end
end
