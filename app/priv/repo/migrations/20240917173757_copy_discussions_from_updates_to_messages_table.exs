defmodule Operately.Repo.Migrations.CopyDiscussionsFromUpdatesToMessagesTable do
  use Ecto.Migration

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  def up do
    execute("CREATE TABLE messages AS SELECT * FROM updates WHERE updates.type = 'project_discussion';")
    execute("ALTER TABLE messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);")

    alter table(:messages) do
      add :space_id, references(:groups, type: :binary_id, on_delete: :nothing)
      add :body, :jsonb
    end

    create index(:messages, [:space_id])
    create index(:messages, [:author_id])

    flush()

    update_fields()

    alter table(:messages) do
      remove :updatable_id, :uuid
      remove :updatable_type, :string
      remove :type, :string
      remove :content, :jsonb
      remove :acknowledged, :boolean
      remove :acknowledged_at, :utc_datetime
      remove :acknowledging_person_id, :binary_id
      remove :previous_phase, :string
      remove :new_phase, :string
      remove :previous_health, :string
      remove :new_health, :string
    end
  end

  def down do
    drop index(:messages, [:space_id])
    drop index(:messages, [:author_id])

    drop table("messages")
  end

  defp update_fields do
    from(c in "messages", select: [:id, :updatable_id, :content])
    |> Repo.all()
    |> Enum.each(fn update ->
      from(c in "messages", where: c.id == ^update.id)
      |> Repo.update_all(set: [
        space_id: update.updatable_id,
        title: update.content["title"],
        body: update.content["body"],
      ])
    end)
  end
end
