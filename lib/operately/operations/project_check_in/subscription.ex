defmodule Operately.Operations.ProjectCheckIn.Subscription do
  alias Ecto.Multi
  alias Operately.Notifications.Subscription

  def insert(multi, author, attrs) do
    mentioned = find_mentioned_people(attrs.description)
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

  defp find_mentioned_people(description) do
    {:ok, ids} =
      description
      |> Operately.RichContent.find_mentioned_ids()
      |> Enum.uniq()
      |> OperatelyWeb.Api.Helpers.decode_id()

    ids
  end

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
