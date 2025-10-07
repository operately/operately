defmodule Operately.Repo.Migrations.AddMilestonesOrderingStateToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :milestones_ordering_state, {:array, :string}, default: [], null: false
    end
  end
end
