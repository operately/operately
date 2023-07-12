defmodule Operately.Repo.Migrations.AddTypeToPanels do
  use Ecto.Migration

  def change do
    alter table(:dashboard_panels) do
      add :type, :string
    end
  end
end
