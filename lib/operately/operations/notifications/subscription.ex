defmodule Operately.Operations.Notifications.Subscription do
  alias Ecto.Multi
  alias Operately.RichContent
  alias Operately.Notifications.Subscription

  def insert(multi, author, attrs) do
    mentioned = RichContent.find_mentioned_ids(attrs.content, :decode_ids)
    invited = [author.id | attrs.subscriber_ids]

    ids = categorize_ids(invited, mentioned)

    Enum.reduce(ids, multi, fn {id, type}, multi ->
      name = "subscription_" <> id

      Multi.insert(multi, name, fn changes ->
        Subscription.changeset(%{
          subscription_list_id: changes.subscription_list.id,
          person_id: id,
          type: type,
        })
      end)
    end)
  end

  #
  # Helpers
  #

  defp categorize_ids(invited, mentioned) do
    mentioned ++ invited
    |> Enum.uniq()
    |> Enum.map(fn id ->
      if Enum.member?(invited, id) do
        {id, :invited}
      else
        {id, :mentioned}
      end
    end)
  end
end
