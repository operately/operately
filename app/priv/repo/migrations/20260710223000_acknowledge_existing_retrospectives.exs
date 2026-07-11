defmodule Operately.Repo.Migrations.AcknowledgeExistingRetrospectives do
  use Ecto.Migration

  def up do
    Operately.Data.Change104AcknowledgeExistingRetrospectives.run()
  end

  def down do
    :ok
  end
end
