defmodule Operately.Data.Change111BackfillMigrationVersionEditors do
  @moduledoc """
  Sets editor_id on migration-baseline document versions from the document author.

  Idempotent: only updates versions where origin is migration, editor_id is null,
  and the document still has an author_id.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Document, DocumentVersion}

  def run do
    from(v in DocumentVersion,
      join: d in Document,
      on: v.document_id == d.id,
      where: v.origin == "migration" and is_nil(v.editor_id) and not is_nil(d.author_id),
      update: [set: [editor_id: d.author_id]]
    )
    |> Repo.update_all([])
  end

  defmodule Document do
    use Operately.Schema

    schema "resource_documents" do
      field :author_id, :binary_id
    end
  end

  defmodule DocumentVersion do
    use Operately.Schema

    schema "resource_document_versions" do
      field :document_id, :binary_id
      field :editor_id, :binary_id
      field :origin, :string
    end
  end
end
