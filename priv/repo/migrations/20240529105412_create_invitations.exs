defmodule Operately.Repo.Migrations.CreateInvitations do
  use Ecto.Migration

  def change do
    create table(:invitations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :admin_id, references(:accounts, on_delete: :nothing, type: :binary_id)
      add :member_id, references(:accounts, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:invitations, [:admin_id])
    create index(:invitations, [:member_id])
  end
end
