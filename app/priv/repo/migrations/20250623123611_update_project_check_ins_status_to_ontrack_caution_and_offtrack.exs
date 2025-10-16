defmodule Operately.Repo.Migrations.UpdateProjectCheckInsStatusToOntrackCautionAndOfftrack do
  use Ecto.Migration

  def up do
    Operately.Data.Change057UpdateProjectCheckInsStatus.run()
  end

  def down do
  end
end
