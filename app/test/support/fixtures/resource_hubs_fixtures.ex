defmodule Operately.ResourceHubsFixtures do
  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Support.RichText

  def default_resource_hub_for_space(space) do
    from(h in ResourceHub,
      where: h.space_id == ^space.id,
      order_by: [asc: h.inserted_at],
      limit: 1
    )
    |> Repo.one!()
  end

  def default_resource_hub_for_project(project) do
    from(h in ResourceHub,
      where: h.project_id == ^project.id,
      order_by: [asc: h.inserted_at],
      limit: 1
    )
    |> Repo.one!()
  end

  def resource_hub_fixture(creator, parent, attrs \\ %{}) do
    attrs = Enum.into(attrs, %{
      name: "Resource hub",
      description: RichText.rich_text("This is a rosource hub"),
      anonymous_access_level: Binding.view_access(),
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
    })

    {:ok, hub} = Operately.ResourceHubs.create_resource_hub(creator, parent, attrs)
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
    })

    folder
  end

  def document_fixture(hub_id, author_id, attrs \\ %{}) do
    {:ok, node} = Operately.ResourceHubs.create_node(%{
      resource_hub_id: hub_id,
      parent_folder_id: attrs[:parent_folder_id] && attrs.parent_folder_id,
      name: attrs[:name] || "Document",
      type: :document,
    })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, document} = Operately.ResourceHubs.create_document(%{
      node_id: node.id,
      author_id: author_id,
      state: attrs[:state] || :published,
      content: attrs[:content] || RichText.rich_text("Content"),
      subscription_list_id: subscription_list.id,
    })

    {:ok, _} = Operately.Notifications.update_subscription_list(subscription_list, %{
      parent_type: :resource_hub_document,
      parent_id: document.id,
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

    blob_attrs =
      Keyword.get(attrs, :blob_attrs, %{})
      |> Enum.into(%{author_id: author.id, company_id: author.company_id})

    blob = Operately.BlobsFixtures.blob_fixture(blob_attrs)
    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, file} = Operately.ResourceHubs.create_file(%{
      node_id: node.id,
      author_id: author.id,
      blob_id: blob.id,
      subscription_list_id: subscription_list.id,
      description: Keyword.get(attrs, :description, RichText.rich_text("Content")) ,
    })

    {:ok, _} = Operately.Notifications.update_subscription_list(subscription_list, %{
      parent_id: file.id,
      parent_type: :resource_hub_file,
    })

    file
  end

  def link_fixture(hub, author, attrs \\ %{}) do
    {:ok, node} = Operately.ResourceHubs.create_node(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs[:parent_folder_id] && attrs.parent_folder_id,
      name: attrs[:name] || "Link",
      type: :link,
    })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, link} = Operately.ResourceHubs.create_link(%{
      node_id: node.id,
      author_id: author.id,
      subscription_list_id: subscription_list.id,
      url: attrs[:url] || "http://localhost:4000",
      description: attrs[:description] || RichText.rich_text("Description"),
      type: attrs[:type] || :other,
    })

    {:ok, _} = Operately.Notifications.update_subscription_list(subscription_list, %{
      parent_id: link.id,
      parent_type: :resource_hub_link,
    })

    link
  end
end
