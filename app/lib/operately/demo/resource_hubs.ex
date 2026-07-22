defmodule Operately.Demo.ResourceHubs do
  alias Operately.Demo.{Resources, Comments}
  alias Operately.Repo
  alias Operately.RichContent.Builder
  alias Operately.ResourceHubs.{DocumentVersion, ResourceHub}
  alias Operately.Operations.{ResourceHubDocumentCreating, ResourceHubDocumentEditing, ResourceHubLinkCreating}

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

    {:ok, document} =
      ResourceHubDocumentCreating.run(author, hub, %{
        name: data.name,
        content: Resources.rich_text!(resources, data.content),
        post_as_draft: false,
        send_to_everyone: true,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: []
      })

    document = maybe_backdate_created_version(document, data)
    document = apply_edits(resources, document, data[:edits])

    Comments.create_comments(resources, document, data[:comments])

    document
  end

  defp apply_edits(_resources, document, nil), do: document
  defp apply_edits(_resources, document, []), do: document

  defp apply_edits(resources, document, edits) do
    Enum.reduce(edits, document, fn edit, current ->
      apply_edit(resources, current, edit)
    end)
  end

  defp apply_edit(resources, document, edit) do
    author = Resources.get(resources, edit[:author] || :owner)
    document = Repo.preload(document, [:node, :resource_hub])

    {:ok, updated} =
      ResourceHubDocumentEditing.run(author, document, %{
        name: edit[:name] || document.name,
        content: Resources.rich_text!(resources, edit.content)
      })

    maybe_backdate_version(updated, updated.current_version, edit[:days_ago])
  end

  defp maybe_backdate_created_version(document, data) do
    maybe_backdate_version(document, 1, data[:days_ago])
  end

  defp maybe_backdate_version(document, _version_number, nil), do: document

  defp maybe_backdate_version(document, version_number, days_ago) when is_integer(days_ago) do
    timestamp =
      Date.utc_today()
      |> Date.add(-days_ago)
      |> NaiveDateTime.new!(~T[10:00:00])

    version = DocumentVersion.get_by_document_and_number(document.id, version_number)

    {:ok, _} =
      version
      |> Ecto.Changeset.change(inserted_at: timestamp)
      |> Repo.update()

    document
  end

  defp create_link(resources, data) do
    author = Resources.get(resources, data[:author] || :owner)
    hub = get_hub(resources, data)

    {:ok, link} =
      ResourceHubLinkCreating.run(author, hub, %{
        name: data.name,
        url: data.url,
        content: link_content(data, resources),
        type: data.type,
        send_to_everyone: true,
        subscription_parent_type: :resource_hub_link,
        subscriber_ids: []
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
