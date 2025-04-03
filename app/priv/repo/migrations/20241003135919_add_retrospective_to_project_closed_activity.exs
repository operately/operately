defmodule Operately.Repo.Migrations.AddRetrospectiveToProjectClosedActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change031AddRetrospectiveToProjectClosedActivity.run()
  end

  def down do

  end
end
