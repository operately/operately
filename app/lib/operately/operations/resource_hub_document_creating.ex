defmodule Operately.Operations.ResourceHubDocumentCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent
  alias Operately.ResourceHubs.{Document, DocumentVersion, Node}
  alias Operately.Search.ResourceHubIndex
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, hub, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:node, Node.changeset(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs[:folder_id],
      type: :document,
    }))
    |> Multi.insert(:document, fn changes ->
      Document.changeset(%{
        node_id: changes.node.id,
        author_id: author.id,
        name: attrs.name,
        content: attrs.content,
        current_version: 1,
        state: state(attrs),
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> maybe_insert_created_version(author, attrs)
    |> SubscriptionList.update(:document)
    |> ResourceHubIndex.enqueue_resource(:search_document, :document, fn changes -> changes.document.id end)
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
          resource_hub_id: hub.id,
          document_id: changes.document.id,
          node_id: changes.node.id,
          name: changes.document.name,
          copied_document_id: attrs[:copied_document] && attrs.copied_document.id,
          copied_document_node_id: attrs[:copied_document] && attrs.copied_document.node_id,
        }
        |> Map.merge(Parent.parent_fields(hub))
      end)
    end
  end

  defp maybe_insert_created_version(multi, author, attrs) do
    if attrs.post_as_draft do
      multi
    else
      Multi.insert(multi, :version, fn changes ->
        DocumentVersion.changeset(%{
          document_id: changes.document.id,
          version_number: 1,
          title: changes.document.name,
          content: changes.document.content,
          editor_id: author.id,
          origin: :created
        })
      end)
    end
  end

  defp state(attrs) do
    if attrs.post_as_draft, do: :draft, else: :published
  end
end
