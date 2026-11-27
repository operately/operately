defmodule Operately.Repo.Migrations.MigrateProjectDiscussionsToMessages do
  use Ecto.Migration

  def up, do: Operately.Data.Change124MigrateProjectDiscussions.run()

  def down, do: raise("Restoring project discussion threads requires restoring the pre-migration backup")
end
