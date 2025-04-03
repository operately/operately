defmodule :"Elixir.Operately.Repo.Migrations.Connect-people-with-the-company" do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :company_id, references(:companies, type: :binary_id)
    end

    create index(:people, [:company_id])
  end
end
