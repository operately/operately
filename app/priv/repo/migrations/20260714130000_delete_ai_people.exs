defmodule Operately.Repo.Migrations.DeleteAiPeople do
  use Ecto.Migration

  def up do
    Operately.Data.Change105DeleteAiPeople.run()
  end

  def down do
    :ok
  end
end
