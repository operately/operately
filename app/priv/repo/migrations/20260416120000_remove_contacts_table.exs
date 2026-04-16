defmodule Operately.Repo.Migrations.RemoveContactsTable do
  use Ecto.Migration

  def change do
    drop table(:contacts)
  end
end
