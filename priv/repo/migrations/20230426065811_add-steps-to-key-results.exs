defmodule :"Elixir.Operately.Repo.Migrations.Add-steps-to-key-results" do
  use Ecto.Migration

  def change do
    alter table(:key_results) do
      add :steps_total, :integer
      add :steps_completed, :integer
    end
  end
end
