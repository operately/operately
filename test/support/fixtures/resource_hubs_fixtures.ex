defmodule Operately.ResourceHubsFixtures do
  alias Operately.Support.RichText

  def resource_hub_fixture(space_id, attrs \\ %{}) do
    {:ok, hub} =
      attrs
      |> Enum.into(%{
        space_id: space_id,
        name: "Resource hub",
        description: RichText.rich_text("This is a rosource hub")
      })
      |> Operately.ResourceHubs.create_resource_hub()

    context = Operately.AccessFixtures.context_fixture(%{resource_hub_id: hub.id})
    space_group = Operately.Access.get_group(group_id: space_id, tag: :standard)
    Operately.AccessFixtures.binding_fixture(%{
      group_id: space_group.id,
      context_id: context.id,
      access_level:  Operately.Access.Binding.from_atom(attrs[:space_access_level] || :no_access),
    })

    hub
  end

  def folder_fixture(hub_id, attrs \\ %{}) do
    {:ok, node} = Operately.ResourceHubs.create_node(%{
      resource_hub_id: hub_id,
      folder_id: attrs[:folder_id] && attrs.folder_id,
      name: attrs[:name] || "some name",
      type: :folder,
    })

    {:ok, folder} = Operately.ResourceHubs.create_folder(%{
      node_id: node.id,
      description: attrs[:description] || RichText.rich_text("This is a rosource hub"),
    })

    folder
  end
end
