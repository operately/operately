defmodule Operately.Demo.ResourceHubs do
  alias Operately.Demo.{Resources, Comments}
  alias Operately.RichContent.Builder
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Operations.{ResourceHubDocumentCreating, ResourceHubLinkCreating}

  def create_documents(resources, nil), do: resources

  def create_documents(resources, data) do
    Resources.create(resources, data, fn {resources, data, _index} ->
      create_document(resources, data)
    end)
  end

  def create_links(resources, nil), do: resources

  def create_links(resources, data) do
    Resources.create(resources, data, fn {resources, data, _index} ->
      create_link(resources, data)
    end)
  end

  defp create_document(resources, data) do
    author = Resources.get(resources, data[:author] || :owner)
    hub = get_hub(resources, data)

    {:ok, document} = ResourceHubDocumentCreating.run(author, hub, %{
      name: data.name,
      content: Resources.rich_text!(resources, data.content),
      post_as_draft: false,
      send_to_everyone: true,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: [],
    })

    Comments.create_comments(resources, document, data[:comments])

    document
  end

  defp create_link(resources, data) do
    author = Resources.get(resources, data[:author] || :owner)
    hub = get_hub(resources, data)

    {:ok, link} = ResourceHubLinkCreating.run(author, hub, %{
      name: data.name,
      url: data.url,
      content: link_content(data, resources),
      type: data.type,
      send_to_everyone: true,
      subscription_parent_type: :resource_hub_link,
      subscriber_ids: [],
    })

    link
  end

  defp link_content(%{content: content}, resources) when is_binary(content) do
    Resources.rich_text!(resources, content)
  end

  defp link_content(_, _resources) do
    Builder.empty_content()
  end

  defp get_hub(resources, %{project: project_key}) do
    project = Resources.get(resources, project_key)
    {:ok, hub} = ResourceHub.get(:system, project_id: project.id)
    hub
  end

  defp get_hub(resources, %{goal: goal_key}) do
    goal = Resources.get(resources, goal_key)
    {:ok, hub} = ResourceHub.get(:system, goal_id: goal.id)
    hub
  end

  defp get_hub(resources, %{space: space_key}) do
    space = Resources.get(resources, space_key)
    {:ok, hub} = ResourceHub.get(:system, space_id: space.id)
    hub
  end
end
