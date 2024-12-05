defmodule Operately.Repo.Migrations.AddHeightAndWidthFieldsToBlobsSchema do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :height, :integer
      add :width, :integer
    end
  end
end
