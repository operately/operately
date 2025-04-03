defmodule :"Elixir.Operately.Repo.Migrations.Add-title-to-updates" do
  use Ecto.Migration

  def change do
    alter table(:updates) do
      add :title, :string
    end
  end
end
