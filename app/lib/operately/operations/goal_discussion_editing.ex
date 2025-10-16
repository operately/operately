defmodule Operately.Operations.GoalDiscussionEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Notifications.SubscriptionList

  @action :goal_discussion_editing

  def run(author, activity, attrs) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])

    change =
      Operately.Comments.CommentThread.changeset(activity.comment_thread, %{
        title: attrs.title,
        message: attrs.message
      })

    Multi.new()
    |> Multi.update(:thread, change)
    |> update_subscriptions(attrs.message)
    |> Activities.insert_sync(author.id, @action, fn _changes ->
      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        activity_id: activity.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:activity)
  end

  defp update_subscriptions(multi, content) do
    multi
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.thread.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(content)
  end
end
