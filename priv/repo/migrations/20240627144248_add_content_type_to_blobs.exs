defmodule Operately.Repo.Migrations.AddContentTypeToBlobs do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :content_type, :string
    end
  end
end
