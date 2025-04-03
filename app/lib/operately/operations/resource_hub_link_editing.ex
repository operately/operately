defmodule Operately.Operations.ResourceHubLinkEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{Link, Node}

  def run(author, link, attrs) do
    Multi.new()
    |> Multi.update(:link, Link.changeset(link, %{
      url: attrs.url,
      type: attrs.type,
      description: attrs.description,
    }))
    |> Multi.update(:node, Node.changeset(link.node, %{name: attrs.name}))
    |> Multi.run(:link_with_node, fn _, changes ->
      link = Map.put(changes.link, :node, changes.node)
      {:ok, link}
    end)
    |> Activities.insert_sync(author.id, :resource_hub_link_edited, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: link.resource_hub.space_id,
        resource_hub_id: link.resource_hub.id,
        node_id: link.node_id,
        link_id: link.id,
        previous_link: %{
          name: link.node.name,
          type: Atom.to_string(link.type),
          url: link.url,
        },
        updated_link: %{
          name: attrs.name,
          type: attrs.type,
          url: attrs.url,
        }
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:link_with_node)
  end
end
