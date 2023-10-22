defmodule Operately.Repo.Migrations.AddActionToActivity do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :action, :string
    end
  end
end
