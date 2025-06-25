defmodule Operately.Repo.Migrations.AddSuccessStatusToProject do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :success_status, :string
    end
  end
end
