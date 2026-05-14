defmodule OperatelyWeb.Api.ExternalMutations.Mutations.CreateAvatarBlob do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def setup(ctx) do
    Factory.setup(ctx)
  end

  @impl true
  def inputs(_ctx) do
    %{
      files: [
        %{
          filename: "avatar.png",
          size: 1024,
          content_type: "image/png"
        }
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert length(response.blobs) == 1
    assert hd(response.blobs).id
    refute Map.has_key?(response, :error)
  end
end
