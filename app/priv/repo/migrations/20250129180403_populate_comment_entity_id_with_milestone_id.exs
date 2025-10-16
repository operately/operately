defmodule Operately.Repo.Migrations.PopulateCommentEntityIdWithMilestoneId do
  use Ecto.Migration

  def up do
    Operately.Data.Change049PopulateCommentEntityIdWithMilestoneId.run()
  end

  def down do
  end
end
