defmodule Operately.Repo.Migrations.AddSizeToBlobs do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :size, :integer, default: 0
    end
  end
end
