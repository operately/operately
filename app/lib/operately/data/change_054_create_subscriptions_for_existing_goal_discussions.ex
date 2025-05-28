defmodule Operately.Data.Change054CreateSubscriptionsForExistingGoalDiscussions do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Comments, Notifications, Repo}
  alias Operately.Comments.CommentThread
  alias Operately.Notifications.{SubscriptionList, Subscription}

  def run do
    Repo.transaction(fn ->
      from(t in CommentThread,
        join: a in assoc(t, :activity),
        preload: [activity: a],
        where: is_nil(t.subscription_list_id),
        where: a.action in ["goal_discussion_creation", "goal_closing", "goal_reopening", "goal_timeframe_editing"]
      )
      |> Repo.all()
      |> create_lists()
    end)
  end

  defp create_lists(threads) when is_list(threads) do
    Enum.each(threads, &create_subscriptions_list/1)
  end

  defp create_subscriptions_list(thread) do
    people = get_binded_people(thread.activity.content["goal_id"])

    case SubscriptionList.get(:system, parent_id: thread.id, parent_type: :comment_thread) do
      {:error, :not_found} ->
        {:ok, list} = Notifications.create_subscription_list(%{
          parent_id: thread.id,
          parent_type: :comment_thread,
        })
        list

      {:ok, list} -> list
    end
    |> update_thread(thread)
    |> create_subscriptions(people)
  end

  defp update_thread(list, thread) do
    {:ok, _} = Comments.update_comment_thread(thread, %{
      subscription_list_id: list.id
    })

    list
  end

  defp create_subscriptions(list, people) when is_list(people) do
    Enum.each(people, &create_subscription(list, &1))
  end

  defp create_subscription(list, person) do
    case Subscription.get(:system, subscription_list_id: list.id, person_id: person.id) do
      {:error, :not_found} ->
        {:ok, _} = Notifications.create_subscription(%{
          subscription_list_id: list.id,
          person_id: person.id,
          type: :invited,
        })
      _ -> :ok
    end
  end

  defp get_binded_people(goal_id) do
    {:ok, goal} = Operately.Goals.Goal.get(:system, id: goal_id, opts: [preload: :access_context])
    Operately.Access.BindedPeopleLoader.load(goal.access_context.id)
  end
end
