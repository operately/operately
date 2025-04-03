defmodule Operately.Repo.Migrations.CreateAlignments do
  use Ecto.Migration

  def change do
    create table(:alignments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :parent, :uuid
      add :parent_type, :string
      add :child, :uuid
      add :child_type, :string

      timestamps()
    end
  end
end
