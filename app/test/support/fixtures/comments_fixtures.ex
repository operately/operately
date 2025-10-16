defmodule Operately.CommentsFixtures do
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Comments.CommentThread

  def comment_fixture(author, attrs) do
    {:ok, comment} =
      attrs
      |> Enum.into(%{
        author_id: author.id,
        content: %{"message" => "some comment"}
      })
      |> Comment.changeset()
      |> Repo.insert()

    comment
  end

  def comment_thread_fixture(attrs) do
    attrs_keyword = if is_map(attrs), do: Keyword.new(attrs), else: attrs

    # add person_ids to attrs with a list of person ids to create subscriptions
    subscription_list = Operately.NotificationsFixtures.subscriptions_list_fixture(attrs_keyword)

    {:ok, thread} =
      attrs
      |> Enum.into(%{
        parent_type: :activity,
        message: %{"message" => "some message"},
        subscription_list_id: subscription_list.id
      })
      |> CommentThread.changeset()
      |> Repo.insert()

    {:ok, _} =
      Operately.Notifications.update_subscription_list(subscription_list, %{
        parent_type: :comment_thread,
        parent_id: thread.id
      })

    thread
  end
end
