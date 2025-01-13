defmodule Operately.Operations.ResourceHubFolderCopying.SubscriptionsList do
  alias Operately.Repo
  alias Operately.Notifications.SubscriptionList

  def copy(nodes) do
    children_with_new_ids = generate_new_ids(nodes)

    data = prepare_subscription_list_data(children_with_new_ids)

    count = length(data)
    {^count, _} = Repo.insert_all(SubscriptionList, data)

    update_node_references(nodes, children_with_new_ids)
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

  defp update_node_references(nodes, children_with_ids) do
    Enum.map(nodes, fn node ->
      case find_matching_child(node, children_with_ids) do
        nil -> node
        child -> update_node_content(node, child)
      end
    end)
  end

  defp find_matching_child(node, children_with_ids) do
    Enum.find(children_with_ids, fn child ->
      cond do
        node.link && node.link.id == child.id -> true
        node.file && node.file.id == child.id -> true
        node.document && node.document.id == child.id -> true
        true -> false
      end
    end)
  end

  defp update_node_content(node, child) do
    cond do
      node.link ->
        link = Map.put(node.link, :subscription_list_id, child.new_subscription_list_id)
        Map.put(node, :link, link)
      node.file -> true
        file = Map.put(node.file, :subscription_list_id, child.new_subscription_list_id)
        Map.put(node, :file, file)
      node.document -> true
        document = Map.put(node.document, :subscription_list_id, child.new_subscription_list_id)
        Map.put(node, :document, document)
    end
  end
end
