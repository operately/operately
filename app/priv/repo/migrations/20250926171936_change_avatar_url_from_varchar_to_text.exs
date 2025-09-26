defmodule Operately.Repo.Migrations.ChangeAvatarUrlFromVarcharToText do
  use Ecto.Migration

  def change do
    alter table(:people) do
      modify :avatar_url, :text, from: :string
    end
  end
end
