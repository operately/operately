defmodule Operately.Repo.Migrations.AddCommentThreadIdToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :comment_thread_id, references(:comment_threads, on_delete: :delete_all, type: :binary_id)
    end
  end
end
