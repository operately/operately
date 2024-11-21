defmodule Operately.ResourceHubsFixtures do
  alias Operately.Support.RichText
  alias Operately.Access.Binding

  def resource_hub_fixture(creator, space, attrs \\ %{}) do
    attrs = Enum.into(attrs, %{
      name: "Resource hub",
      description: RichText.rich_text("This is a rosource hub"),
      anonymous_access_level: Binding.view_access(),
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
    })

    {:ok, hub} = Operately.ResourceHubs.create_resource_hub(creator, space, attrs)
    hub
  end

  def folder_fixture(hub_id, attrs \\ %{}) do
    {:ok, node} = Operately.ResourceHubs.create_node(%{
      resource_hub_id: hub_id,
      parent_folder_id: attrs[:parent_folder_id] && attrs.parent_folder_id,
      name: attrs[:name] || "some name",
      type: :folder,
    })

    {:ok, folder} = Operately.ResourceHubs.create_folder(%{
      node_id: node.id,
      description: attrs[:description] || RichText.rich_text("This is a rosource hub"),
    })

    folder
  end

  def document_fixture(hub_id, author_id, attrs \\ []) do
    {:ok, node} = Operately.ResourceHubs.create_node(%{
      resource_hub_id: hub_id,
      parent_folder_id: attrs[:parent_folder_id] && attrs.parent_folder_id,
      name: attrs[:name] || "some name",
      type: :document,
    })

    {:ok, document} = Operately.ResourceHubs.create_document(%{
      node_id: node.id,
      author_id: author_id,
      content: attrs[:content] || RichText.rich_text("Content"),
    })

    document
  end

  def file_fixture(hub, author, attrs \\ []) do
    {:ok, node} = Operately.ResourceHubs.create_node(%{
      resource_hub_id: hub.id,
      parent_folder_id: Keyword.get(attrs, :parent_folder_id),
      name: Keyword.get(attrs, :name, "some name"),
      type: :file,
    })

    blob = Operately.BlobsFixtures.blob_fixture(%{author_id: author.id, company_id: author.company_id})

    {:ok, file} = Operately.ResourceHubs.create_file(%{
      node_id: node.id,
      author_id: author.id,
      blob_id: blob.id,
      description: Keyword.get(attrs, :description, RichText.rich_text("Content")) ,
    })

    file
  end
end
