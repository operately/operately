defmodule Operately.Operations.DiscussionPosting do
  alias Ecto.Multi
  alias Operately.Messages.{Message, Owner}
  alias Operately.Operations.Discussions.SharedSteps
  alias Operately.Repo
  alias Operately.Search.IndexUpdates
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(creator, owner, attrs) do
    with :ok <- validate_schedule(attrs),
         :ok <- authorize_owner(creator, owner),
         {:ok, owner_fields} <- Owner.fields(owner, attrs) do
      Multi.new()
      |> SubscriptionList.insert(Map.put(attrs, :subscription_parent_type, :message))
      |> Subscription.insert(creator, attrs)
      |> Multi.insert(:message, fn changes ->
        owner_fields
        |> Map.merge(%{
          author_id: creator.id,
          title: attrs.title,
          body: attrs.content,
          state: state(attrs),
          scheduled_at: attrs[:scheduled_at],
          subscription_list_id: changes.subscription_list.id
        })
        |> Message.changeset()
      end)
      |> SubscriptionList.update(:message)
      |> SharedSteps.update_schedule(attrs[:scheduled_at])
      |> SharedSteps.record_activity()
      |> IndexUpdates.enqueue(:search_discussion, "discussion", fn %{message: message} -> message.id end)
      |> Repo.transaction()
      |> SharedSteps.result()
    end
  end

  defp authorize_owner(_creator, %Operately.Groups.Group{}), do: :ok

  defp authorize_owner(creator, %module{id: id}) do
    with {:ok, _} <- module.get(creator, id: id, opts: [required_access_level: Operately.Access.Binding.edit_access()]), do: :ok
  end

  defp validate_schedule(%{post_as_draft: true, scheduled_at: time}) when not is_nil(time), do: {:error, :invalid_schedule}
  defp validate_schedule(attrs), do: Operately.Scheduling.validate_scheduled_at(attrs[:scheduled_at])

  defp state(%{post_as_draft: true}), do: :draft
  defp state(%{scheduled_at: time}) when not is_nil(time), do: :scheduled
  defp state(_attrs), do: :published
end
