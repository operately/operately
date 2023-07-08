defmodule Operately.Repo.Migrations.ChangeTypeOfPinnedTypeFromUuidToString do
  use Ecto.Migration

  def change do
    alter table(:people_pins) do
      modify :pinned_type, :string
    end
  end
end
