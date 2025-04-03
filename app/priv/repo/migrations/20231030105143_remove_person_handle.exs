defmodule Operately.Repo.Migrations.RemovePersonHandle do
  use Ecto.Migration

  def change do
    alter table(:people) do
      remove :handle
    end
  end
end
