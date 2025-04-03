defmodule Operately.Repo.Migrations.AddLastCheckInStatusToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :last_check_in_status, :string
    end
  end
end
