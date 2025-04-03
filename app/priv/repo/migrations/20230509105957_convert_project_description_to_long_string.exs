defmodule Operately.Repo.Migrations.ConvertProjectDescriptionToLongString do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      modify :description, :text
    end
  end
end
