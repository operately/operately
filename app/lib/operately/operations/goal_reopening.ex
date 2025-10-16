defmodule Operately.Operations.GoalReopening do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Goals
  alias Operately.Comments.CommentThread
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  @action :goal_reopening

  def run(author, goal, attrs) do
    changeset = Goals.Goal.changeset(goal, %{closed_at: nil, closed_by_id: nil, success: nil, success_status: nil})

    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.update(:goal, changeset)
    |> Activities.insert_sync(
      author.id,
      @action,
      fn _changes ->
        %{
          company_id: author.company_id,
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
        subscription_list_id: changes.subscription_list.id
      })
    end)
    |> Multi.update(:activity_with_thread, fn changes ->
      Activities.Activity.changeset(changes.activity, %{
        comment_thread_id: changes.thread.id
      })
    end)
    |> SubscriptionList.update(:thread)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
