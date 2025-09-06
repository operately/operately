defmodule Operately.Repo.Migrations.AddAvatarUrlToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :avatar_url, :string
    end
  end
end