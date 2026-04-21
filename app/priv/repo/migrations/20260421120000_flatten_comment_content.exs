defmodule Operately.Repo.Migrations.FlattenCommentContent do
  use Ecto.Migration

  def up do
    Operately.Data.Change100FlattenCommentContent.run()
  end

  def down do
    :ok
  end
end
