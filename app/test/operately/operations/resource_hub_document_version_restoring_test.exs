defmodule Operately.Operations.ResourceHubDocumentVersionRestoringTest do
  use Operately.DataCase

  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Operations.ResourceHubDocumentVersionRestoring
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
    |> then(&create_extra_versions/1)
  end

  test "restores an earlier version as a new current snapshot", ctx do
    document = preload_document(ctx.document)
    assert document.current_version == 3
    assert document.name == "Version three"
    v1 = DocumentVersion.get_by_document_and_number(document.id, 1)

    assert {:ok, %{document: updated, restored_version: restored}} =
             ResourceHubDocumentVersionRestoring.run(ctx.creator, document, %{
               version_number: 1,
               expected_current_version: 3
             })

    assert updated.current_version == 4
    assert updated.name == v1.title
    assert updated.content == v1.content
    assert restored.version_number == 4
    assert restored.origin == :restored
    assert restored.restored_from_version_number == 1
    assert restored.editor_id == ctx.creator.id

    numbers = DocumentVersion.list_for_document(document.id) |> Enum.map(& &1.version_number)
    assert numbers == [4, 3, 2, 1]

    assert Repo.exists?(
             from(a in Operately.Activities.Activity,
               where:
                 a.action == "resource_hub_document_version_restored" and
                   a.content["document_id"] == ^document.id and
                   a.content["version_number"] == 1
             )
           )
  end

  test "identical restore is an idempotent no-op", ctx do
    document = preload_document(ctx.document)

    assert {:ok, %{document: same, restored_version: nil}} =
             ResourceHubDocumentVersionRestoring.run(ctx.creator, document, %{
               version_number: 3,
               expected_current_version: 3
             })

    assert same.current_version == 3
    assert length(DocumentVersion.list_for_document(document.id)) == 3

    refute Repo.exists?(
             from(a in Operately.Activities.Activity,
               where: a.action == "resource_hub_document_version_restored" and a.content["document_id"] == ^document.id
             )
           )
  end

  test "rejects stale expected_current_version", ctx do
    document = preload_document(ctx.document)

    assert {:error, :version_conflict} =
             ResourceHubDocumentVersionRestoring.run(ctx.creator, document, %{
               version_number: 1,
               expected_current_version: 1
             })

    assert Repo.reload!(document).current_version == 3
  end

  test "rejects missing source versions", ctx do
    document = preload_document(ctx.document)

    assert {:error, :not_found} =
             ResourceHubDocumentVersionRestoring.run(ctx.creator, document, %{
               version_number: 99,
               expected_current_version: 3
             })
  end

  defp create_extra_versions(ctx) do
    document = preload_document(ctx.document)

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Version two",
        content: RichText.rich_text("Second")
      })

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(
        ctx.creator,
        Repo.reload!(document) |> preload_document(),
        %{
          name: "Version three",
          content: RichText.rich_text("Third")
        }
      )

    Map.put(ctx, :document, Repo.reload!(document))
  end

  defp preload_document(document) do
    Repo.preload(document, [:resource_hub, :node], force: true)
  end
end
