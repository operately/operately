defmodule Operately.Repo.Migrations.AddTasksEnabledBoleanFieldToSpacesSchema do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :tools, :map,
        default: %{
          tasks_enabled: false,
          discussions_enabled: true,
          resource_hub_enabled: true
        },
        null: false
    end
  end
end
