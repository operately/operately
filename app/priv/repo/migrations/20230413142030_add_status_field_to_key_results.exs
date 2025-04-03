defmodule Operately.Repo.Migrations.AddStatusFieldToKeyResults do
  use Ecto.Migration

  def change do
    alter table(:key_results) do
      add :status, :string
    end
  end
end
