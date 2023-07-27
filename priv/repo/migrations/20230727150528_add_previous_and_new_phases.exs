defmodule Operately.Repo.Migrations.AddPreviousAndNewPhases do
  use Ecto.Migration

  def change do
    alter table(:updates) do
      add :previous_phase, :string
      add :new_phase, :string
    end
  end
end
