defmodule Operately.Repo.Migrations.AddPhasesToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :phase, :string
    end
  end
end
