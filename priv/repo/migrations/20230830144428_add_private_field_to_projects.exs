defmodule Operately.Repo.Migrations.AddPrivateFieldToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :private, :boolean, default: false
    end
  end
end
