defmodule OperatelyWeb.Api.Serializers.ProjectDiscussion do
  @moduledoc "Presents a project-owned message using the existing project discussion API shape."
  alias Operately.Comments.CommentThread
  alias Operately.Messages.Message
  alias OperatelyWeb.Api.Serializer

  def serialize(%Message{} = message), do: Serializer.serialize(as_thread(message), level: :essential)

  def serialize(_unloaded), do: nil

  def as_thread(%Message{} = message) do
    %CommentThread{
      id: message.id,
      title: message.title,
      message: message.body,
      inserted_at: message.inserted_at,
      author: message.author,
      reactions: message.reactions,
      comments: message.comments,
      notifications: message.notifications,
      project: message.project,
      project_permissions: message.permissions,
      space: message.space,
      subscription_list: legacy_subscription_list(message.subscription_list),
      potential_subscribers: message.potential_subscribers,
      comments_count: message.comments_count
    }
  end

  defp legacy_subscription_list(%Operately.Notifications.SubscriptionList{} = list), do: %{list | parent_type: :comment_thread}
  defp legacy_subscription_list(unloaded), do: unloaded
end
