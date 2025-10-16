defmodule Operately.Repo.Migrations.UpdateGroupEditedActivitySpaceKye do
  use Ecto.Migration

  def up do
    Operately.Data.Change081UpdateGroupEditedSpaceKey.run()
  end

  def down do
  end
end
