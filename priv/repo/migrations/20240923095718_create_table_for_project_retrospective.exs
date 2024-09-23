defmodule Operately.Repo.Migrations.CreateTableForProjectRetrospective do
  import Ecto.Query, only: [from: 2]
  use Ecto.Migration

  alias Operately.Repo
  alias Operately.Projects.{Project, Retrospective}

  def up do
    create table(:project_retrospectives, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id)
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)
      add :content, :jsonb
      add :closed_at, :utc_datetime

      timestamps()
    end

    create index(:project_retrospectives, [:subscription_list_id])
    create index(:project_retrospectives, [:author_id])
    create unique_index(:project_retrospectives, [:project_id])

    flush()

    from(p in Project, where: not is_nil(p.retrospective))
    |> Repo.all()
    |> Enum.each(fn p ->
      {:ok, _} = Retrospective.changeset(%{
        project_id: p.id,
        author_id: p.closed_by_id,
        closed_at: p.closed_at,
        content: p.retrospective,
      })
      |> Repo.insert()
    end)
  end

  def down do
    drop index(:project_retrospectives, [:subscription_list_id])
    drop index(:project_retrospectives, [:author_id])
    drop unique_index(:project_retrospectives, [:project_id])

    drop table(:project_retrospectives)
  end
end
