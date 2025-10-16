defmodule Operately.Repo.Migrations.AddSubscriptionListToCommentThreadSchema do
  use Ecto.Migration

  def change do
    alter table(:comment_threads) do
      add :subscription_list_id,
          references(:subscription_lists, on_delete: :nothing, type: :binary_id)
    end

    create index(:comment_threads, [:subscription_list_id])
  end
end
