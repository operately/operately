defmodule Operately.Repo.Migrations.AddStateToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :state, :string, default: "published"
    end
  end
end
