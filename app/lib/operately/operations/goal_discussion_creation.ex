defmodule Operately.Operations.GoalDiscussionCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Comments.CommentThread
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  @action :goal_discussion_creation

  def run(author, goal, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Activities.insert_sync(
      author.id,
      @action,
      fn _changes ->
        %{
          company_id: goal.company_id,
          space_id: goal.group_id,
          goal_id: goal.id
        }
      end,
      include_notification: false
    )
    |> Multi.insert(:thread, fn changes ->
      CommentThread.changeset(%{
        parent_id: changes.activity.id,
        parent_type: "activity",
        message: attrs.content,
        title: attrs.title,
        has_title: true,
        subscription_list_id: changes.subscription_list.id
      })
    end)
    |> Multi.run(:activity_with_thread, fn _, changes ->
      {:ok, activity} =
        Activities.update_activity(changes.activity, %{
          comment_thread_id: changes.thread.id
        })

      {:ok, Map.put(activity, :comment_thread, changes.thread)}
    end)
    |> SubscriptionList.update(:thread)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:activity_with_thread)
  end
end
