defmodule Operately.Operations.ResourceHubFileCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{File, Node}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, hub, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:node, Node.changeset(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs[:folder_id],
      name: attrs.name,
      type: :file,
    }))
    |> Multi.insert(:file, fn changes ->
      File.changeset(%{
        node_id: changes.node.id,
        author_id: author.id,
        blob_id: attrs.blob_id,
        preview_blob_id: attrs[:preview_blob_id],
        description: attrs.content,
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update(:file)
    |> Multi.run(:file_with_node, fn _, changes ->
      file = Map.put(changes.file, :node, changes.node)
      {:ok, file}
    end)
    |> Multi.run(:blob, fn _, _ ->
      blob = Operately.Blobs.get_blob!(attrs.blob_id)
      Operately.Blobs.update_blob(blob, %{status: :uploaded})
    end)
    |> Multi.run(:preview_blob, fn _, _ ->
      if attrs[:preview_blob_id] do
        blob = Operately.Blobs.get_blob!(attrs.preview_blob_id)
        Operately.Blobs.update_blob(blob, %{status: :uploaded})
      else
        {:ok, nil}
      end
    end)
    |> Activities.insert_sync(author.id, :resource_hub_file_created, fn changes ->
      %{
        company_id: author.company_id,
        space_id: hub.space_id,
        resource_hub_id: hub.id,
        file_id: changes.file.id,
        file_name: changes.node.name,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:file_with_node)
  end
end
