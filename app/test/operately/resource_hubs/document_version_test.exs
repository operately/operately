defmodule Operately.ResourceHubs.DocumentVersionTest do
  use Operately.DataCase, async: true

  alias Operately.Repo
  alias Operately.ResourceHubs
  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Support.Factory

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)

    {:ok, ctx}
  end

  test "accepts each valid origin", ctx do
    Enum.each(DocumentVersion.valid_origins(), fn origin ->
      attrs = version_attrs(ctx, origin: origin, version_number: origin_to_number(origin))

      attrs =
        if origin == :restored do
          Map.put(attrs, :restored_from_version_number, 1)
        else
          attrs
        end

      assert {:ok, version} = ResourceHubs.create_document_version(attrs)
      assert version.origin == origin
    end)
  end

  test "rejects non-positive version and schema version numbers", ctx do
    assert {:error, changeset} =
             ResourceHubs.create_document_version(version_attrs(ctx, version_number: 0))

    assert %{version_number: _} = errors_on(changeset)

    assert {:error, changeset} =
             ResourceHubs.create_document_version(version_attrs(ctx, content_schema_version: 0))

    assert %{content_schema_version: _} = errors_on(changeset)
  end

  test "enforces unique document/version numbers", ctx do
    assert {:ok, _} = ResourceHubs.create_document_version(version_attrs(ctx, version_number: 1))

    assert {:error, changeset} =
             ResourceHubs.create_document_version(version_attrs(ctx, version_number: 1))

    assert %{document_id: _} = errors_on(changeset)
  end

  test "enforces restored_from constraint with origin", ctx do
    assert {:error, changeset} =
             ResourceHubs.create_document_version(
               version_attrs(ctx, origin: :restored, version_number: 2)
             )

    assert %{restored_from_version_number: _} = errors_on(changeset)

    assert {:error, changeset} =
             ResourceHubs.create_document_version(
               version_attrs(ctx,
                 origin: :edited,
                 version_number: 2,
                 restored_from_version_number: 1
               )
             )

    assert %{restored_from_version_number: _} = errors_on(changeset)

    assert {:ok, _} =
             ResourceHubs.create_document_version(
               version_attrs(ctx,
                 origin: :restored,
                 version_number: 2,
                 restored_from_version_number: 1
               )
             )
  end

  test "editor_id foreign key nilifies when the editor person is removed", ctx do
    assert {:ok, version} =
             ResourceHubs.create_document_version(
               version_attrs(ctx, version_number: 1, editor_id: ctx.creator.id)
             )

    assert version.editor_id == ctx.creator.id

    %{rows: [[delete_action]]} =
      Ecto.Adapters.SQL.query!(
        Repo,
        """
        SELECT confdeltype
        FROM pg_constraint
        WHERE conname = 'resource_document_versions_editor_id_fkey'
        """
      )

    # PostgreSQL confdeltype 'n' means ON DELETE SET NULL
    assert delete_action == "n"

    assert {:ok, migration_version} =
             ResourceHubs.create_document_version(
               version_attrs(ctx, version_number: 2, editor_id: nil, origin: :edited)
             )

    assert migration_version.editor_id == nil
  end

  test "document hard deletion removes versions", ctx do
    assert {:ok, version} = ResourceHubs.create_document_version(version_attrs(ctx, version_number: 1))

    assert {:ok, _} = Repo.delete(ctx.document)

    assert Repo.get(DocumentVersion, version.id) == nil
  end

  test "list_for_document and get_by_document_and_number", ctx do
    assert {:ok, v1} = ResourceHubs.create_document_version(version_attrs(ctx, version_number: 1))

    assert {:ok, v2} =
             ResourceHubs.create_document_version(version_attrs(ctx, origin: :edited, version_number: 2))

    assert [listed_v2, listed_v1] = DocumentVersion.list_for_document(ctx.document.id)
    assert listed_v2.id == v2.id
    assert listed_v1.id == v1.id

    assert DocumentVersion.get_by_document_and_number(ctx.document.id, 2).id == v2.id
    assert DocumentVersion.get_by_document_and_number(ctx.document.id, 99) == nil
  end

  test "there is no public update path for versions", _ctx do
    refute function_exported?(ResourceHubs, :update_document_version, 2)
    refute function_exported?(DocumentVersion, :update_changeset, 2)
  end

  defp version_attrs(ctx, overrides) do
    Map.merge(
      %{
        document_id: ctx.document.id,
        version_number: 1,
        title: ctx.document.name,
        content: ctx.document.content,
        content_schema_version: 1,
        editor_id: ctx.creator.id,
        origin: :created
      },
      Map.new(overrides)
    )
  end

  defp origin_to_number(:created), do: 1
  defp origin_to_number(:edited), do: 2
  defp origin_to_number(:restored), do: 3
  defp origin_to_number(:migration), do: 4
end
