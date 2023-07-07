defmodule Operately.Repo.Migrations.ChangePinedToPinnedInPeoplePins do
  use Ecto.Migration

  def change do
    rename table(:people_pins), :pined_id, to: :pinned_id
    rename table(:people_pins), :pened_type, to: :pinned_type
  end
end
