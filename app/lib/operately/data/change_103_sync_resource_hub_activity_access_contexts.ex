defmodule Operately.Data.Change103SyncResourceHubActivityAccessContexts do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{AccessContext, Activity, ResourceHub}

  @parent_space_hub_names ["Documents & Files", "Docs & Files"]

  def run do
    Repo.transaction(fn ->
      fetch_activity_contexts()
      |> Enum.each(&update_activity_context/1)
    end)
  end

  defp fetch_activity_contexts do
    from(a in Activity,
      join: h in ResourceHub,
      on: fragment("?::text = ?->>?", h.id, a.content, "resource_hub_id"),
      join: c in AccessContext,
      on:
        (not is_nil(h.project_id) and c.project_id == h.project_id) or
          (is_nil(h.project_id) and h.name in ^@parent_space_hub_names and c.group_id == h.space_id) or
          (is_nil(h.project_id) and h.name not in ^@parent_space_hub_names and c.resource_hub_id == h.id),
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
      field :group_id, :binary_id
      field :project_id, :binary_id
      field :resource_hub_id, :binary_id

      timestamps()
    end
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :space_id, :binary_id
      field :project_id, :binary_id
      field :name, :string

      timestamps()
    end
  end
end
