defmodule Operately.Operations.DiscussionEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Messages.Message
  alias Operately.Notifications.SubscriptionList

  def run(creator, message, attrs) do
    Multi.new()
    |> Multi.update(:message, Message.changeset(message, attrs))
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system, parent_id: changes.message.id, opts: [
        preload: :subscriptions
      ])
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(attrs.body)
    |> record_activity(creator, message, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end

  defp record_activity(multi, creator, message, attrs) do
    cond do
      message.state == :draft && attrs[:state] == :published ->
        Activities.insert_sync(multi, creator.id, :discussion_posting, fn _ -> %{
          company_id: creator.company_id,
          space_id: message.space.id,
          discussion_id: message.id,
          title: message.title,
        } end)

      message.state != :draft ->
        Activities.insert_sync(multi, creator.id, :discussion_editing, fn _ -> %{
          company_id: creator.company_id,
          space_id: message.space.id,
          discussion_id: message.id,
        } end)

      true ->
        # it is a draft and it is not being published, do nothing
        multi 
    end
  end
end
