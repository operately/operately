defmodule Operately.Data.Change103SyncResourceHubActivityAccessContexts do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{AccessContext, Activity}

  def run do
    Repo.transaction(fn ->
      fetch_activity_contexts()
      |> Enum.each(&update_activity_context/1)
    end)
  end

  defp fetch_activity_contexts do
    from(a in Activity,
      join: c in AccessContext,
      on: fragment("?::text = ?->>?", c.resource_hub_id, a.content, "resource_hub_id"),
      where: fragment("?->>? IS NOT NULL", a.content, "resource_hub_id"),
      select: %{activity_id: a.id, access_context_id: c.id}
    )
    |> Repo.all()
  end

  defp update_activity_context(%{activity_id: activity_id, access_context_id: access_context_id}) do
    from(a in Activity, where: a.id == ^activity_id)
    |> Repo.update_all(set: [access_context_id: access_context_id])
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :content, :map
      field :access_context_id, :binary_id

      timestamps()
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :resource_hub_id, :binary_id

      timestamps()
    end
  end
end
