defmodule Operately.Repo.Migrations.RemoveAlignmentsTable do
  use Ecto.Migration

  def change do
    drop table(:alignments)
  end
end
