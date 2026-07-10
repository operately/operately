defmodule Operately.Repo.Migrations.AddAcknowledgementToRetrospectives do
  use Ecto.Migration

  def change do
    alter table(:project_retrospectives) do
      add :acknowledged_by_id, references(:people, on_delete: :nilify_all, type: :binary_id)
      add :acknowledged_at, :utc_datetime
    end

    alter table(:comment_threads) do
      add :acknowledged_by_id, references(:people, on_delete: :nilify_all, type: :binary_id)
      add :acknowledged_at, :utc_datetime
    end
  end
end
