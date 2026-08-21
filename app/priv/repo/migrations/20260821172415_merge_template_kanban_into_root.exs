defmodule Operately.Repo.Migrations.MergeTemplateKanbanIntoRoot do
  use Ecto.Migration

  def up do
    Operately.Data.Change112MergeTemplateKanbanIntoRoot.run()
  end

  def down do
    :ok
  end
end
