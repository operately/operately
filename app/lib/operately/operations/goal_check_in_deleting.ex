defmodule Operately.Operations.GoalCheckInDeleting do
  alias Ecto.Multi
  alias Operately.{Repo, Updates}
  alias Operately.Goals.{Goal, Update}
  alias Operately.Notifications.{Subscription, SubscriptionList}

  import Ecto.Query, only: [from: 2]

  def run(check_in) do
    goal = Repo.preload(check_in, :goal).goal
    previous_check_in = find_previous_check_in(check_in)

    Multi.new()
    |> delete_reactions(check_in)
    |> delete_comments(check_in)
    |> delete_subscriptions(check_in)
    |> delete_subscription_list(check_in)
    |> Multi.delete(:check_in, check_in)
    |> maybe_update_goal(goal, check_in, previous_check_in)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
  end

  defp find_previous_check_in(check_in) do
    Repo.one(
      from c in Update,
        where: c.goal_id == ^check_in.goal_id and c.id != ^check_in.id and c.state == :published,
        order_by: [desc: c.inserted_at],
        limit: 1
    )
  end

  defp delete_reactions(multi, check_in) do
    Multi.run(multi, :reactions, fn _, _ ->
      {_count, reactions} = Updates.delete_reactions([check_in.id])
      {:ok, reactions}
    end)
  end

  defp delete_comments(multi, check_in) do
    Multi.run(multi, :comments, fn _, _ ->
      {_count, comments} = Updates.delete_comments([check_in.id])
      {:ok, comments}
    end)
  end

  defp delete_subscriptions(multi, check_in) do
    Multi.run(multi, :subscriptions, fn _, _ ->
      {_count, subscriptions} =
        from(s in Subscription, where: s.subscription_list_id == ^check_in.subscription_list_id)
        |> Repo.delete_all()

      {:ok, subscriptions}
    end)
  end

  defp delete_subscription_list(multi, check_in) do
    Multi.run(multi, :subscription_list, fn _, _ ->
      subscription_list = Repo.get!(SubscriptionList, check_in.subscription_list_id)
      Repo.delete(subscription_list)
    end)
  end

  defp maybe_update_goal(multi, goal, check_in, previous_check_in) do
    Multi.update(multi, :goal, fn _ ->
      if goal.last_check_in_id == check_in.id do
        Goal.changeset(goal, %{
          last_check_in_id: previous_check_in && previous_check_in.id,
          last_update_status: previous_check_in && previous_check_in.status
        })
      else
        Goal.changeset(goal, %{})
      end
    end)
  end
end
