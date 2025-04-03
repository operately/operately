defmodule Operately.Repo.Migrations.AddStatusToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :status, :string, default: "active"
      add :closed_at, :utc_datetime
      add :retrospective, :jsonb
    end
  end
end
