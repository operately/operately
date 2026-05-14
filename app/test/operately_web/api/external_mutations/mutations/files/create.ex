defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Files.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.RichText

  @impl true
  def mutation_name, do: "files/create"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_blob(:blob)
  end

  @impl true
  def inputs(ctx) do
    %{
      resource_hub_id: Paths.resource_hub_id(ctx.resource_hub),
      files: [
        %{
          blob_id: ctx.blob.id,
          name: "My file.pdf",
          description: RichText.rich_text("Uploaded from external API", :as_string)
        }
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(hd(response.files).id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    assert length(response.files) == 1
    assert list.send_to_everyone
    refute Map.has_key?(response, :error)
  end
end
