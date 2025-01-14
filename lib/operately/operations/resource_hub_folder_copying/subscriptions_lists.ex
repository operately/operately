defmodule Operately.Operations.ResourceHubFolderCopying.SubscriptionsLists do
  alias Operately.Repo
  alias Operately.Notifications.SubscriptionList
  alias Operately.ResourceHubs.{Document, File, Link}

  @doc """
  Takes a list of nodes (documents, files and links) and copies
  their subscription lists.

  Returns the list of nodes with their subscriptions lists replaced
  by the newly created ones.
  """
  def copy(nodes) do
    children_with_new_ids = generate_new_ids(nodes)

    data = prepare_subscription_list_data(children_with_new_ids)

    count = length(data)
    {^count, new_lists} = Repo.insert_all(SubscriptionList, data, returning: true)

    update_nodes(nodes, new_lists)
  end

  defp generate_new_ids(nodes) when is_list(nodes) do
    Enum.map(nodes, fn node ->
      cond do
        node.link -> generate_new_ids(node.link)
        node.file -> generate_new_ids(node.file)
        node.document -> generate_new_ids(node.document)
        true -> nil
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp generate_new_ids(content) do
    Map.put(content, :new_subscription_list_id, Ecto.UUID.generate())
  end

  defp prepare_subscription_list_data(children) do
    Enum.map(children, fn child ->
      now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      %{
        id: child.new_subscription_list_id,
        parent_id: child.subscription_list.parent_id,
        parent_type: child.subscription_list.parent_type,
        send_to_everyone: child.subscription_list.send_to_everyone,
        inserted_at: now,
        updated_at: now,
      }
    end)
  end

  defp update_nodes(nodes, new_lists) do
    Enum.map(nodes, fn node ->
      case find_matching_list(node, new_lists) do
        nil -> node
        list -> update_node_list(node, list)
      end
    end)
  end

  defp find_matching_list(node, new_lists) do
    Enum.find(new_lists, fn list ->
      cond do
        node.link && node.link.id == list.parent_id -> true
        node.file && node.file.id == list.parent_id -> true
        node.document && node.document.id == list.parent_id -> true
        true -> false
      end
    end)
  end

  defp update_node_list(node = %{document: %Document{}}, list) do
    document = replace_subscriptions(list, node.document)
    Map.put(node, :document, document)
  end

  defp update_node_list(node = %{link: %Link{}}, list) do
    link = replace_subscriptions(list, node.link)
    Map.put(node, :link, link)
  end

  defp update_node_list(node = %{file: %File{}}, list) do
    file = replace_subscriptions(list, node.file)
    Map.put(node, :file, file)
  end

  defp replace_subscriptions(list, resource) do
    list = Map.put(list, :subscriptions, resource.subscription_list.subscriptions)
    Map.put(resource, :subscription_list, list)
  end
end
