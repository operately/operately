defmodule Operately.Data.Change111BackfillMigrationVersionEditorsTest do
  use Operately.DataCase

  alias Operately.Data.Change111BackfillMigrationVersionEditors, as: Change
  alias Operately.Data.Change111BackfillMigrationVersionEditors.{Document, DocumentVersion}
  alias Operately.Support.Factory

  # Minimal seed schemas so this test stays independent of live ResourceHubs modules.
  defmodule SeedDocument do
    use Operately.Schema

    schema "resource_documents" do
      field :author_id, :binary_id
      field :name, :string
      field :content, :map
      field :current_version, :integer

      timestamps()
    end
  end

  defmodule SeedDocumentVersion do
    use Operately.Schema

    schema "resource_document_versions" do
      field :document_id, :binary_id
      field :version_number, :integer
      field :title, :string
      field :content, :map
      field :editor_id, :binary_id
      field :origin, :string
      field :inserted_at, :naive_datetime
    end
  end

  setup ctx do
    ctx = Factory.setup(ctx)
    {:ok, ctx}
  end

  test "sets editor_id from document author on migration baselines", ctx do
    document = insert_document!(ctx.creator.id, "Migrated doc")
    version = insert_version!(document.id, origin: "migration", editor_id: nil)

    Change.run()

    assert Repo.get!(DocumentVersion, version.id).editor_id == ctx.creator.id
  end

  test "is idempotent", ctx do
    document = insert_document!(ctx.creator.id, "Idempotent doc")
    version = insert_version!(document.id, origin: "migration", editor_id: nil)

    Change.run()
    Change.run()

    assert Repo.get!(DocumentVersion, version.id).editor_id == ctx.creator.id
  end

  test "skips non-migration versions", ctx do
    document = insert_document!(ctx.creator.id, "Created doc")
    version = insert_version!(document.id, origin: "created", editor_id: nil)

    Change.run()

    assert Repo.get!(DocumentVersion, version.id).editor_id == nil
  end

  test "skips migration versions that already have an editor", ctx do
    other =
      ctx
      |> Factory.add_company_member(:other)
      |> then(& &1.other)

    document = insert_document!(ctx.creator.id, "Already attributed")
    version = insert_version!(document.id, origin: "migration", editor_id: other.id)

    Change.run()

    assert Repo.get!(DocumentVersion, version.id).editor_id == other.id
  end

  test "skips documents without an author", _ctx do
    document = insert_document!(nil, "No author")
    version = insert_version!(document.id, origin: "migration", editor_id: nil)

    Change.run()

    assert Repo.get!(DocumentVersion, version.id).editor_id == nil
    assert Repo.get!(Document, document.id).author_id == nil
  end

  #
  # Helpers
  #

  defp insert_document!(author_id, name) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, document} =
      %SeedDocument{}
      |> Ecto.Changeset.change(%{
        author_id: author_id,
        name: name,
        content: %{"type" => "doc", "content" => []},
        current_version: 1,
        inserted_at: now,
        updated_at: now
      })
      |> Repo.insert()

    document
  end

  defp insert_version!(document_id, opts) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, version} =
      %SeedDocumentVersion{}
      |> Ecto.Changeset.change(%{
        document_id: document_id,
        version_number: 1,
        title: "Version",
        content: %{"type" => "doc", "content" => []},
        editor_id: opts[:editor_id],
        origin: opts[:origin],
        inserted_at: now
      })
      |> Repo.insert()

    version
  end
end
