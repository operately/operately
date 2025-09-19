defmodule Operately.Operations.ResourceHubDocumentEditing do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.ResourceHubs.{Document, Node}
  alias Operately.Notifications.SubscriptionList

  def run(author, document, attrs) do
    Multi.new()
    |> Multi.update(:document, Document.changeset(document, %{content: attrs.content}))
    |> Multi.update(:node, fn changes ->
      Node.changeset(document.node, %{
        name: attrs.name,
        updated_at: changes.document.updated_at
      })
    end)
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.document.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(attrs.content)
    |> Activities.insert_sync(author.id, :resource_hub_document_edited, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: document.resource_hub.space_id,
        resource_hub_id: document.resource_hub.id,
        node_id: document.node_id,
        document_id: document.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:document)
  end
end
