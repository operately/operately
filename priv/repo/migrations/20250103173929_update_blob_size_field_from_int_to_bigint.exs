defmodule Operately.Repo.Migrations.UpdateBlobSizeFieldFromIntToBigint do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      modify :size, :bigint
    end
  end
end
