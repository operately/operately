defmodule Operately.Demo.ResourceHubs do
  alias Operately.Demo.{Resources, PoorMansMarkdown, Comments}
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Operations.ResourceHubDocumentCreating

  def create_documents(resources, nil), do: resources

  def create_documents(resources, data) do
    Resources.create(resources, data, fn {resources, data, _index} ->
      create_document(resources, data)
    end)
  end

  defp create_document(resources, data) do
    owner = Resources.get(resources, :owner)
    space = Resources.get(resources, data.space)
    {:ok, hub} = ResourceHub.get(:system, space_id: space.id)

    {:ok, document} = ResourceHubDocumentCreating.run(owner, hub, %{
      name: data.name,
      content: PoorMansMarkdown.from_markdown(data.content, resources),
      post_as_draft: false,
      send_to_everyone: true,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: [],
    })

    Comments.create_comments(resources, document, data[:comments])

    document
  end
end
