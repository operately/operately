defmodule Operately.Operations.ResourceHubFolderCopying.Subscriptions do
  alias Operately.Repo
  alias Operately.Notifications.Subscription

  @moduledoc """
  Takes a list of nodes (documents, files and links) and copies
  all their subscriptions.

  Returns the nodes unchanged, which will be copied later in the
  same transaction.
  """
  def copy(nodes) do
    subscriptions = extract_subscriptions(nodes)

    data = prepare_subscriptions_data(subscriptions)

    count = length(data)
    {^count, _} = Repo.insert_all(Subscription, data)

    nodes
  end

  defp extract_subscriptions(nodes) do
    Enum.map(nodes, fn n ->
      cond do
        n.link -> {n.link.subscription_list.id, n.link.subscription_list.subscriptions}
        n.file -> {n.file.subscription_list.id, n.file.subscription_list.subscriptions}
        n.document -> {n.document.subscription_list.id, n.document.subscription_list.subscriptions}
        true -> {nil, []}
      end
    end)
    |> Enum.filter(fn {_, subs} -> length(subs) > 1 end)
  end

  defp prepare_subscriptions_data(subscriptions) do
    Enum.map(subscriptions, fn {list_id, subs} ->
      now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      Enum.map(subs, fn s ->
        %{
          person_id: s.person_id,
          subscription_list_id: list_id,
          type: s.type,
          canceled: s.canceled,
          inserted_at: now,
          updated_at: now,
        }
      end)
    end)
    |> List.flatten()
    |> Enum.filter(&(not &1.canceled))
  end
end
