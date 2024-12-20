defmodule Operately.Operations.ResourceHubLinkCreating do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.ResourceHubs.{Link, Node}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, hub, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:node, Node.changeset(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs[:folder_id],
      name: attrs.name,
      type: :link,
    }))
    |> Multi.insert(:link, fn changes ->
      Link.changeset(%{
        node_id: changes.node.id,
        author_id: author.id,
        url: attrs.url,
        description: attrs.content,
        type: attrs.type,
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update(:link)
    |> Multi.run(:link_with_node, fn _, changes ->
      link = Map.put(changes.link, :node, changes.node)
      {:ok, link}
    end)
    |> Activities.insert_sync(author.id, :resource_hub_link_created, fn changes ->
      %{
        company_id: author.company_id,
        space_id: hub.space_id,
        resource_hub_id: hub.id,
        link_id: changes.link.id,
        node_id: changes.node.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:link_with_node)
  end
end
