defmodule Operately.Operations.ResourceHubFileCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{File, Node}
  alias Operately.Notifications.{SubscriptionList, Subscription}

  def run(author, hub, attrs) do
    multi = Multi.new()

    attrs.files
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({file, index}, multi) ->
      multi
      |> insert_subscriptions_list(index, attrs)
      |> insert_subscription(author, file, index, attrs)
      |> insert_node(hub, file, index, attrs)
      |> insert_file(author, file, index)
      |> update_subscriptions_list(index)
      |> update_blobs(file, index)
    end)
    |> parse_result(attrs.files)
    |> insert_activity(author, hub)
    |> Repo.transaction()
    |> Repo.extract_result(:result)
  end

  defp insert_subscriptions_list(multi, index, attrs) do
    multi
    |> Multi.insert(subscriptions_list_name(index), SubscriptionList.changeset(%{
      send_to_everyone: attrs.send_to_everyone,
      parent_type: :resource_hub_file,
    }))
  end

  defp insert_subscription(multi, author, file, index, attrs) do
    mentioned = Operately.RichContent.find_mentioned_ids(file.description, :decode_ids)
    invited = [author.id | attrs.subscriber_ids]
    ids = Operately.Operations.Notifications.Subscription.categorize_ids(invited, mentioned)

    Enum.reduce(ids, multi, fn {id, type}, multi ->
      name = subscription_name(index, id)

      Multi.insert(multi, name, fn changes ->
        subscription_list = subscriptions_list_name(index)

        Subscription.changeset(%{
          subscription_list_id: changes[subscription_list].id,
          person_id: id,
          type: type,
        })
      end)
    end)
  end

  defp insert_node(multi, hub, file, index, attrs) do
    Multi.insert(multi, node_name(index), Node.changeset(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs[:folder_id],
      name: file.name,
      type: :file,
    }))
  end

  defp insert_file(multi, author, file, index) do
    Multi.insert(multi, file_name(index), fn changes ->
      File.changeset(%{
        node_id: changes[node_name(index)].id,
        author_id: author.id,
        blob_id: file.blob_id,
        preview_blob_id: file[:preview_blob_id],
        description: file.description,
        subscription_list_id: changes[subscriptions_list_name(index)].id,
      })
    end)
  end

  defp update_subscriptions_list(multi, index) do
    name = subscriptions_list_updated_name(index)

    multi
    |> Multi.update(name, fn changes ->
      SubscriptionList.changeset(changes[subscriptions_list_name(index)], %{
        parent_id: changes[file_name(index)].id,
      })
    end)
  end

  defp update_blobs(multi, file, index) do
    multi
    |> Multi.run(blob_name(index), fn _, _ ->
      blob = Operately.Blobs.get_blob!(file.blob_id)
      Operately.Blobs.update_blob(blob, %{status: :uploaded})
    end)
    |> Multi.run(blob_preview_name(index), fn _, _ ->
      if file[:preview_blob_id] do
        blob = Operately.Blobs.get_blob!(file.preview_blob_id)
        Operately.Blobs.update_blob(blob, %{status: :uploaded})
      else
        {:ok, nil}
      end
    end)
  end

  defp insert_activity(multi, author, hub) do
    multi
    |> Activities.insert_sync(author.id, :resource_hub_file_created, fn changes ->
      %{
        company_id: author.company_id,
        space_id: hub.space_id,
        resource_hub_id: hub.id,
        files: Enum.map(changes.result, fn file ->
          %{file_id: file.id, node_id: file.node.id}
        end)
      }
    end)
  end

  defp parse_result(multi, files) do
    multi
    |> Multi.run(:result, fn _, changes ->
      count = length(files) - 1

      files = Enum.map(0..count, fn index ->
        node = changes[node_name(index)]
        file = changes[file_name(index)]

        Map.put(file, :node, node)
      end)

      {:ok, files}
    end)
  end

  #
  # Names
  #

  defp subscriptions_list_name(index), do: "subscription_list_#{index}"
  defp subscriptions_list_updated_name(index), do: "subscription_list_updated_#{index}"
  defp subscription_name(index, person_id), do: "subscription_#{index}_#{person_id}"
  defp node_name(index), do: "node_#{index}"
  defp file_name(index), do: "file_#{index}"
  defp blob_name(index), do: "blob_#{index}"
  defp blob_preview_name(index), do: "blob_preview_#{index}"
end
