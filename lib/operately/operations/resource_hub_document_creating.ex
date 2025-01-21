defmodule Operately.Operations.ResourceHubDocumentCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{Document, Node}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, hub, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:node, Node.changeset(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs[:folder_id],
      name: attrs.name,
      type: :document,
    }))
    |> Multi.insert(:document, fn changes ->
      Document.changeset(%{
        node_id: changes.node.id,
        author_id: author.id,
        content: attrs.content,
        state: state(attrs),
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update(:document)
    |> Multi.run(:document_with_node, fn _, changes ->
      document = Map.put(changes.document, :node, changes.node)
      {:ok, document}
    end)

    |> record_activity(author, hub, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:document_with_node)
  end

  defp record_activity(multi, author, hub, attrs) do
    if attrs.post_as_draft do
      multi
    else
      Activities.insert_sync(multi, author.id, :resource_hub_document_created, fn changes ->
      %{
        company_id: author.company_id,
        space_id: hub.space_id,
        resource_hub_id: hub.id,
        document_id: changes.document.id,
        node_id: changes.node.id,
        name: changes.node.name,
        copied_document_id: attrs[:copied_document] && attrs.copied_document.id,
        copied_document_node_id: attrs[:copied_document] && attrs.copied_document.node_id,
      }
    end)
    end
  end

  defp state(attrs) do
    if attrs.post_as_draft, do: :draft, else: :published
  end
end
