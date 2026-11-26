defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Wrappers.Documents.UpdateDocument do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.SubscriptionsListEditing

  @impl true
  def mutation_name, do: "documents/update_document"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:subscriber)
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_document(:document, :resource_hub)
    |> then(fn ctx ->
      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.document.id, opts: [preload: :subscriptions])
      {:ok, _} = SubscriptionsListEditing.run(list, %{send_notifications_to_everyone: true, subscriber_ids: [ctx.creator.id, ctx.subscriber.id]})
      ctx
    end)
  end

  @impl true
  def inputs(ctx) do
    %{
      document_id: Paths.document_id(ctx.document),
      name: "Updated Name",
      content: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.document.id
    refute Map.has_key?(response, :error)

    {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.document.id, opts: [preload: :subscriptions])
    assert list.send_to_everyone
    assert Map.new(list.subscriptions, &{&1.person_id, &1.canceled}) == %{ctx.creator.id => false, ctx.subscriber.id => false}
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
