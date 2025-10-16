defmodule Operately.Operations.GoalClosing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals
  alias Operately.Activities
  alias Operately.Comments.CommentThread
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, goal, attrs) do
    changeset =
      Goals.Goal.changeset(goal, %{
        closed_at: DateTime.utc_now(),
        closed_by_id: author.id,
        success: attrs.success,
        success_status: attrs.success_status
      })

    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.update(:goal, changeset)
    |> Activities.insert_sync(
      author.id,
      :goal_closing,
      fn _changes ->
        %{
          company_id: author.company_id,
          space_id: goal.group_id,
          goal_id: goal.id,
          success: attrs.success,
          success_status: attrs.success_status
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
