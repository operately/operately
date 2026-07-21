defmodule Operately.Repo.Migrations.EnsureNameOnResourceFolders do
  use Ecto.Migration

  # Idempotent repair: on prod, version 20260720180000 was recorded when the
  # harden-search migration ran under that number, so AddNameToResourceFolders
  # never applied. Fresh installs already have the column from 20260720180000.
  def up do
    execute "ALTER TABLE resource_folders ADD COLUMN IF NOT EXISTS name varchar"
  end

  def down do
    :ok
  end
end
