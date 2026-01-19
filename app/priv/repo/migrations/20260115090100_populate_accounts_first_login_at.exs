defmodule Operately.Repo.Migrations.PopulateAccountsFirstLoginAt do
  use Ecto.Migration

  def up do
    Operately.Data.Change093PopulateAccountsFirstLoginAt.run()
  end

  def down do

  end
end
