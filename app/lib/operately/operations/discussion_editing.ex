defmodule Operately.Operations.DiscussionEditing do
  alias Ecto.Multi
  alias Operately.Access.Binding
  alias Operately.Messages.{Message, Permissions}
  alias Operately.Operations.Discussions.SharedSteps
  alias Operately.Repo
  alias Operately.Search.IndexUpdates
  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.Notifications.Subscription

  def run(editor, message, attrs) do
    Multi.new()
    |> SharedSteps.lock_message(editor, message.id)
    |> Multi.run(:attributes, fn _, %{current: current} -> edit_attributes(editor, message, current, attrs) end)
    |> Multi.update(:message, fn %{current: current, attributes: attrs} -> Message.changeset(current, attrs) end)
    |> update_mentions(attrs[:body])
    |> SharedSteps.update_schedule(attrs[:scheduled_at])
    |> SharedSteps.record_activity(editor.id)
    |> IndexUpdates.enqueue(:search_discussion, "discussion", message.id)
    |> Repo.transaction()
    |> SharedSteps.result()
  end

  defp edit_attributes(editor, original, current, attrs) do
    state = attrs[:state] || if(attrs[:scheduled_at], do: :scheduled, else: current.state)
    time = if state == :scheduled, do: attrs[:scheduled_at] || current.scheduled_at

    with :ok <- authorize(editor, current, state),
         :ok <- validate_schedule(state, time, attrs),
         :ok <- check_publication(original, current, attrs[:state]) do
      {:ok, %{state: state, scheduled_at: time, title: attrs[:title] || current.title, body: attrs[:body] || current.body}}
    end
  end

  defp authorize(editor, current, state) do
    cond do
      current.request_info.access_level < Binding.edit_access() -> {:error, :forbidden}
      current.state != :published and state == :published and not Permissions.can_publish?(editor, current) -> {:error, :forbidden}
      true -> :ok
    end
  end

  # If the worker published while this request was waiting, do not turn
  # the attempted publication into an unrelated edit of the published post.
  defp check_publication(%{state: before}, %{state: :published}, :published) when before != :published, do: {:error, :forbidden}
  defp check_publication(_, _, _), do: :ok

  defp validate_schedule(:scheduled, nil, _), do: {:error, :invalid_schedule}
  defp validate_schedule(state, _, %{scheduled_at: time}) when not is_nil(time) and state != :scheduled, do: {:error, :invalid_schedule}
  defp validate_schedule(_, _, attrs), do: Operately.Scheduling.validate_scheduled_at(attrs[:scheduled_at])

  defp update_mentions(multi, nil), do: multi

  defp update_mentions(multi, body) do
    multi
    |> Multi.run(:subscription_list, fn _, %{message: message} -> SubscriptionList.get(:system, id: message.subscription_list_id, opts: [preload: :subscriptions]) end)
    |> Subscription.update_mentioned_people(body)
  end
end
