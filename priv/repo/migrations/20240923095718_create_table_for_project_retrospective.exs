defmodule Operately.Repo.Migrations.CreateTableForProjectRetrospective do
  import Ecto.Query, only: [from: 2]
  use Ecto.Migration

  alias Operately.Repo
  alias Operately.Projects.Retrospective

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

    from(p in "projects",
      where: not is_nil(p.retrospective),
      select: [:id, :closed_by_id, :closed_at, :retrospective]
    )
    |> Repo.all()
    |> Enum.each(fn p ->
      {:ok, project_id} = Ecto.UUID.cast(p.id)
      author_id = find_author_id(p)

      {:ok, _} = Retrospective.changeset(%{
        project_id: project_id,
        author_id: author_id,
        closed_at: p.closed_at,
        content: p.retrospective,
      })
      |> Repo.insert()
    end)
  end

  def down do
    from(r in "project_retrospectives", select: [:project_id, :content, :closed_at, :author_id])
    |> Repo.all()
    |> Enum.each(fn r ->
      from(p in "projects", where: p.id == ^r.project_id and is_nil(p.retrospective))
      |> Repo.update_all(set: [
        retrospective: r.content,
        closed_at: r.closed_at,
        closed_by_id: r.author_id,
      ])
    end)

    drop index(:project_retrospectives, [:subscription_list_id])
    drop index(:project_retrospectives, [:author_id])
    drop unique_index(:project_retrospectives, [:project_id])

    drop table(:project_retrospectives)
  end

  #
  # Helpers
  #

  defp find_author_id(project) do
    if project.closed_by_id do
      {:ok, author_id} = Ecto.UUID.cast(project.closed_by_id)
      author_id
    else
      {:ok, project_id} = Ecto.UUID.cast(project.id)

      from(champion in Operately.Projects.Contributor,
        join: person in assoc(champion, :person),
        where: champion.project_id == ^project_id and champion.role == :champion,
        select: person.id
      )
      |> Repo.one!()
    end
  end
end
