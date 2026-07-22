defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Documents.RestoreVersion do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Operations.ResourceHubDocumentEditing
  alias Operately.Support.RichText

  @impl true
  def mutation_name, do: "documents/restore_version"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
    |> then(&create_extra_version/1)
  end

  @impl true
  def inputs(ctx) do
    %{
      document_id: Paths.document_id(ctx.document),
      version_number: 1,
      expected_current_version: ctx.document.current_version
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.document.id
    assert response.document.current_version == 3
    assert response.restored_version.version_number == 3
    assert response.restored_version.origin == "restored"
    assert response.restored_version.restored_from_version_number == 1
  end

  defp create_extra_version(ctx) do
    document = Repo.preload(ctx.document, [:resource_hub, :node])

    {:ok, _} =
      ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Version two",
        content: RichText.rich_text("Second")
      })

    Map.put(ctx, :document, Repo.reload!(document))
  end
end
