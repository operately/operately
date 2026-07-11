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
      SubscriptionList.get(:system,
        parent_id: changes.message.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(attrs.body)
    |> record_activity(creator, message, attrs)
    |> handle_oban_jobs(message, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end

  defp record_activity(multi, creator, message, attrs) do
    cond do
      message.state in [:draft, :scheduled] && attrs[:state] == :published ->
        Activities.insert_sync(multi, creator.id, :discussion_posting, fn _ ->
          %{
            company_id: creator.company_id,
            space_id: message.space.id,
            discussion_id: message.id,
            title: message.title
          }
        end)

      message.state not in [:draft, :scheduled] ->
        Activities.insert_sync(multi, creator.id, :discussion_editing, fn _ ->
          %{
            company_id: creator.company_id,
            space_id: message.space.id,
            discussion_id: message.id
          }
        end)

      true ->
        # it is a draft and it is not being published, do nothing
        multi
    end
  end

  defp handle_oban_jobs(multi, message, attrs) do
    new_state = attrs[:state] || message.state
    new_time = if Map.has_key?(attrs, :scheduled_at), do: attrs.scheduled_at, else: message.scheduled_at

    if message.state == :scheduled or new_state == :scheduled do
      multi
      |> Multi.delete_all(:delete_oban_job, fn _ ->
        import Ecto.Query

        from j in Oban.Job,
          where: j.worker == "Operately.AsyncPublishing.Worker",
          where: fragment("args->>'type' = ?", "message"),
          where: fragment("args->>'id' = ?", ^message.id)
      end)
      |> Multi.run(:insert_oban_job, fn _repo, changes ->
        if new_state == :scheduled and not is_nil(new_time) do
          Operately.AsyncPublishing.Worker.new(
            %{"type" => "message", "id" => changes.message.id},
            scheduled_at: new_time
          )
          |> Oban.insert()
        else
          {:ok, nil}
        end
      end)
    else
      multi
    end
  end
end
