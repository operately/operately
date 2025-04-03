defmodule :"Elixir.Operately.Repo.Migrations.Add-health-to-projects" do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :health, :string, default: "unknown"
    end
  end
end
