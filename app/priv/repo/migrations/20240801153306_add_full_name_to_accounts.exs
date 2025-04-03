defmodule Operately.Repo.Migrations.AddFullNameToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :full_name, :string
    end
  end
end
