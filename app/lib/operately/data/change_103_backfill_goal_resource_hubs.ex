defmodule Operately.Data.Change103BackfillGoalResourceHubs do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Goal, ResourceHub}

  defmodule Goal do
    use Operately.Schema

    schema "goals" do
      soft_delete()
      timestamps()
    end
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :goal_id, :binary_id
      field :name, :string
      field :description, :map

      timestamps()
    end

    def changeset(resource_hub, attrs) do
      resource_hub
      |> cast(attrs, [:goal_id, :name, :description])
      |> validate_required([:goal_id, :name])
    end
  end

  def run do
    Repo.transaction(fn ->
      goals_missing_resource_hubs()
      |> Repo.all(with_deleted: true)
      |> Enum.each(&create_resource_hub/1)
    end)
  end

  defp goals_missing_resource_hubs do
    from(g in Goal,
      left_join: h in ResourceHub,
      on: h.goal_id == g.id,
      where: is_nil(h.id),
      select: %{id: g.id}
    )
  end

  defp create_resource_hub(goal) do
    %ResourceHub{}
    |> ResourceHub.changeset(%{
      goal_id: goal.id,
      name: "Documents & Files",
    })
    |> Repo.insert!()
  end
end
