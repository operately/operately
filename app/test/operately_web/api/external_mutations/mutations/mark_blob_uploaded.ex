defmodule OperatelyWeb.Api.ExternalMutations.Mutations.MarkBlobUploaded do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_blob(:blob)
  end

  @impl true
  def inputs(ctx) do
    %{blob_id: Paths.blob_id(ctx.blob)}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.blob.id
    assert response.blob.status == "uploaded"
    refute Map.has_key?(response, :error)
  end
end
