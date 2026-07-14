defmodule Operately.Operations.DiscussionPosting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(creator, space, attrs) do
    with :ok <- Operately.Scheduling.validate_scheduled_at(attrs[:scheduled_at]) do
      Multi.new()
      |> SubscriptionList.insert(attrs)
      |> Subscription.insert(creator, attrs)
      |> Multi.insert(:message, fn changes ->
        Operately.Messages.Message.changeset(%{
          author_id: creator.id,
          messages_board_id: attrs.messages_board_id,
          title: attrs.title,
          body: attrs.content,
          state: state(attrs),
          scheduled_at: attrs[:scheduled_at],
          subscription_list_id: changes.subscription_list.id
        })
      end)
      |> SubscriptionList.update(:message)
      |> record_activity(creator, space, attrs)
      |> maybe_enqueue_oban_job(attrs)
      |> Repo.transaction()
      |> Repo.extract_result(:message)
    end
  end

  defp record_activity(multi, _creator, _space, %{post_as_draft: true}), do: multi
  defp record_activity(multi, _creator, _space, %{scheduled_at: scheduled_at}) when not is_nil(scheduled_at), do: multi

  defp record_activity(multi, creator, space, attrs) do
    Activities.insert_sync(multi, creator.id, :discussion_posting, fn changes ->
      %{
        company_id: space.company_id,
        space_id: space.id,
        discussion_id: changes.message.id,
        title: attrs.title
      }
    end)
  end

  defp state(%{post_as_draft: true}), do: :draft
  defp state(%{scheduled_at: scheduled_at}) when not is_nil(scheduled_at), do: :scheduled
  defp state(_attrs), do: :published

  defp maybe_enqueue_oban_job(multi, %{scheduled_at: scheduled_at}) when not is_nil(scheduled_at) do
    Multi.insert(multi, :oban_job, fn changes ->
      Operately.AsyncPublishing.Worker.new(
        %{"type" => "message", "id" => changes.message.id},
        scheduled_at: scheduled_at
      )
    end)
  end

  defp maybe_enqueue_oban_job(multi, _attrs), do: multi
end
