defmodule Operately.Repo.Migrations.AddEmojiToReactions do
  use Ecto.Migration

  def change do
    alter table(:reactions) do
      add :emoji, :string
    end
  end
end
