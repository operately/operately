defmodule Operately.Repo.Migrations.UpdateFileCreatedActivityFormat do
  use Ecto.Migration

  def up do
    Operately.Data.Change046UpdateFileCreatedActivityFormat.run()
  end

  def down do

  end
end
