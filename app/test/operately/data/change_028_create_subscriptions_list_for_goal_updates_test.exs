defmodule Operately.Data.Change028CreateSubscriptionsListForGoalUpdatesTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Notifications
  alias Operately.Notifications.Subscription

  setup ctx do
    company = company_fixture(%{})
    creator = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    goal = goal_fixture(creator, %{space_id: company.company_space_id, reviewer_id: reviewer.id, champion_id: champion.id})

    Map.merge(ctx, %{creator: creator, champion: champion, reviewer: reviewer, goal: goal})
  end

  test "creates subscriptions list for existing goal updates", ctx do
    updates = Enum.map(1..1, fn _ ->
      create_update(ctx.goal, ctx.creator)
    end)

    Enum.each(updates, fn u ->
      assert {:error, :not_found} = Subscription.get(:system, subscription_list_id: u.subscription_list_id, person_id: ctx.champion.id)
      assert {:error, :not_found} = Subscription.get(:system, subscription_list_id: u.subscription_list_id, person_id: ctx.reviewer.id)
    end)

    Operately.Data.Change028CreateSubscriptionsListForGoalUpdates.run()

    Enum.each(updates, fn u ->
      assert {:ok, _} = Subscription.get(:system, subscription_list_id: u.subscription_list_id, person_id: ctx.champion.id)
      assert {:ok, _} = Subscription.get(:system, subscription_list_id: u.subscription_list_id, person_id: ctx.reviewer.id)
    end)
  end

  defp create_update(goal, author) do
    with {:ok, subscriptions_list} <- Notifications.create_subscription_list(%{}),
        {:ok, update} <- Operately.Goals.create_update(%{
          goal_id: goal.id,
          author_id: author.id,
          subscription_list_id: subscriptions_list.id,
          message: Operately.Support.RichText.rich_text("message"),
          status: "on_track",
        }),
        {:ok, _} <- Notifications.update_subscription_list(subscriptions_list, %{parent_id: update.id}) do
      update
    end
  end
end
