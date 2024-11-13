defmodule Operately.Operations.DiscussionPosting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(creator, space, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(creator, attrs)
    |> Multi.insert(:message, fn changes ->
      Operately.Messages.Message.changeset(%{
        author_id: creator.id,
        space_id: space.id,
        title: attrs.title,
        body: attrs.content,
        state: state(attrs),
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update(:message)
    |> record_activity(creator, space, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end

  defp record_activity(multi, creator, space, attrs) do
    if attrs.post_as_draft do
      multi
    else
      Activities.insert_sync(multi, creator.id, :discussion_posting, fn changes -> %{
        company_id: space.company_id,
        space_id: space.id,
        discussion_id: changes.message.id,
        title: attrs.title,
      } end)
    end
  end

  defp state(attrs) do
    if attrs.post_as_draft, do: :draft, else: :published
  end
end
