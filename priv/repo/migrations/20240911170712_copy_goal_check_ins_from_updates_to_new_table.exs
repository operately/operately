defmodule Operately.Repo.Migrations.CopyGoalCheckInsFromUpdatesToNewTable do
  use Ecto.Migration

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  def up do
    execute("CREATE TABLE goal_check_ins AS SELECT * FROM updates WHERE updates.type = 'goal_check_in';")

    alter table(:goal_check_ins) do
      add :goal_id, references(:goals, type: :binary_id, on_delete: :nothing)
      add :targets, {:array, :map}
    end

    create index(:goal_check_ins, [:goal_id])

    flush()

    update_fields()

    alter table(:goal_check_ins) do
      remove :updatable_id, :uuid
      remove :updatable_type, :string
      remove :type, :string
      remove :previous_health, :string
      remove :new_health, :string
      remove :previous_phase, :string
      remove :new_phase, :string
      remove :title, :string
      remove :acknowledged, :boolean
    end
    rename table(:goal_check_ins), :acknowledging_person_id, to: :acknowledged_by_id
  end

  def down do
    drop index(:goal_check_ins, [:goal_id])

    drop table("goal_check_ins")
  end

  defp update_fields do
    from(c in "goal_check_ins", select: [:id, :updatable_id, :content])
    |> Repo.all()
    |> Enum.each(fn check_in ->
      from(c in "goal_check_ins", where: c.id == ^check_in.id)
      |> Repo.update_all(set: [
        goal_id: check_in.updatable_id,
        targets: check_in.content["targets"],
        content: check_in.content["message"],
      ])
    end)
  end
end
