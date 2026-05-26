defmodule Operately.Activities.Notifications.MentionedPeople do
  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications.Subscription
  alias Operately.Repo
  alias Operately.RichContent

  def ids(content) when is_binary(content) do
    case Jason.decode(content) do
      {:ok, decoded} -> ids(decoded)
      {:error, _} -> []
    end
  end

  def ids(content) do
    RichContent.find_mentioned_ids(content, :decode_ids)
  rescue
    _ -> []
  end

  def only_current_mentions(person_ids, content) do
    mentioned_ids = MapSet.new(ids(content))

    person_ids
    |> Enum.filter(&MapSet.member?(mentioned_ids, &1))
  end

  def reject_stale_mentioned_subscribers(person_ids, subscription_list_id, content) do
    mentioned_ids = MapSet.new(ids(content))
    subscription_types = subscription_types(subscription_list_id, person_ids)

    Enum.filter(person_ids, fn person_id ->
      case Map.get(subscription_types, person_id) do
        :mentioned -> MapSet.member?(mentioned_ids, person_id)
        _ -> true
      end
    end)
  end

  defp subscription_types(nil, _person_ids), do: %{}
  defp subscription_types(_subscription_list_id, []), do: %{}

  defp subscription_types(subscription_list_id, person_ids) do
    from(s in Subscription,
      where: s.subscription_list_id == ^subscription_list_id and s.person_id in ^person_ids,
      select: {s.person_id, s.type}
    )
    |> Repo.all()
    |> Map.new()
  end
end
