defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Documents.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Notifications.SubscriptionList

  @impl true
  def mutation_name, do: "documents/create"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      resource_hub_id: Paths.resource_hub_id(ctx.resource_hub),
      name: "Updated Name",
      content: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(response.document.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    assert response.document.id
    assert list.send_to_everyone
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
