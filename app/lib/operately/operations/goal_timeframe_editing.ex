defmodule Operately.Operations.GoalTimeframeEditing do
  alias Ecto.Multi
  alias Operately.Repo

  alias Operately.Activities
  alias Operately.Goals.Goal
  alias Operately.Comments.CommentThread
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, goal, attrs) do
    Multi.new()
    |> Multi.update(:goal, Goal.changeset(goal, %{timeframe: attrs.timeframe}))
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Activities.insert_sync(author.id, :goal_timeframe_editing, fn changes ->
      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        old_timeframe: Map.from_struct(goal.timeframe),
        new_timeframe: Map.from_struct(changes.goal.timeframe)
      }
    end, include_notification: false)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity.id,
      parent_type: "activity",
      message: attrs.content,
      subscription_list_id: changes.subscription_list.id,
    }) end)
    |> Multi.update(:activity_with_thread, fn changes ->
      Activities.Activity.changeset(changes.activity, %{comment_thread_id: changes.thread.id})
    end)
    |> SubscriptionList.update(:thread)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
