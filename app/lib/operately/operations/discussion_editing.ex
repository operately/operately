defmodule Operately.Operations.DiscussionEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Messages.Message
  alias Operately.Notifications.SubscriptionList

  def run(creator, message, attrs) do
    with :ok <- Operately.Scheduling.validate_scheduled_at(attrs[:scheduled_at]) do
      update_attrs = %{
        title: attrs[:title] || message.title,
        body: attrs[:body] || message.body,
        state: state(message, attrs),
        scheduled_at: scheduled_at(message, attrs)
      }

      Multi.new()
      |> Multi.update(:message, Message.changeset(message, update_attrs))
      |> Multi.run(:subscription_list, fn _, changes ->
        SubscriptionList.get(:system,
          parent_id: changes.message.id,
          opts: [
            preload: :subscriptions
          ]
        )
      end)
      |> Operately.Operations.Notifications.Subscription.update_mentioned_people(update_attrs.body)
      |> record_activity(creator, message, update_attrs)
      |> handle_oban_jobs(message, attrs)
      |> Repo.transaction()
      |> Repo.extract_result(:message)
    end
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
        # it is a draft/scheduled and it is not being published, do nothing
        multi
    end
  end

  defp state(message, attrs) do
    cond do
      not is_nil(attrs[:state]) -> attrs[:state]
      not is_nil(attrs[:scheduled_at]) -> :scheduled
      true -> message.state
    end
  end

  defp scheduled_at(message, attrs) do
    cond do
      not is_nil(attrs[:scheduled_at]) -> attrs[:scheduled_at]
      attrs[:state] in [:draft, :published] -> nil
      true -> message.scheduled_at
    end
  end

  defp handle_oban_jobs(multi, message, attrs) do
    new_state = state(message, attrs)
    new_time = scheduled_at(message, attrs)

    if scheduled?(message.state) or scheduled?(new_state) do
      multi
      |> Multi.delete_all(:delete_oban_job, fn _ ->
        import Ecto.Query

        from j in Oban.Job,
          where: j.worker == "Operately.AsyncPublishing.Worker",
          where: fragment("args->>'type' = ?", "message"),
          where: fragment("args->>'id' = ?", ^message.id)
      end)
      |> Multi.run(:insert_oban_job, fn _repo, changes ->
        if scheduled?(new_state) and not is_nil(new_time) do
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

  # Widen to atom() so Dialyzer accepts :scheduled before call sites create those values.
  @spec scheduled?(atom()) :: boolean()
  defp scheduled?(state), do: state == :scheduled
end
