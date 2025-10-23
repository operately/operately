defmodule Operately.Data.Change085CreateSubscriptionsForProjectContributorsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications.Subscription
  alias Operately.Support.Factory
  alias Operately.Data.Change085CreateSubscriptionsForProjectContributors

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project_1, :space)
    |> Factory.add_project_contributor(:contributor_1, :project_1)
    |> Factory.add_project_contributor(:contributor_2, :project_1)
    |> Factory.add_project(:project_2, :space)
    |> Factory.add_project_contributor(:contributor_3, :project_2)
  end

  test "creates subscriptions for contributors who don't have them", ctx do
    delete_subscription(ctx.project_1.subscription_list_id, ctx.contributor_1.person_id)
    delete_subscription(ctx.project_1.subscription_list_id, ctx.contributor_2.person_id)
    delete_subscription(ctx.project_2.subscription_list_id, ctx.contributor_3.person_id)

    # Verify subscriptions are deleted
    assert {:error, :not_found} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_1.person_id)
    assert {:error, :not_found} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_2.person_id)
    assert {:error, :not_found} = Subscription.get(:system, subscription_list_id: ctx.project_2.subscription_list_id, person_id: ctx.contributor_3.person_id)

    Change085CreateSubscriptionsForProjectContributors.run()

    # Verify subscriptions are created
    assert {:ok, subscription_1} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_1.person_id)
    assert subscription_1.type == :invited
    assert subscription_1.canceled == false

    assert {:ok, subscription_2} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_2.person_id)
    assert subscription_2.type == :invited
    assert subscription_2.canceled == false

    assert {:ok, subscription_3} = Subscription.get(:system, subscription_list_id: ctx.project_2.subscription_list_id, person_id: ctx.contributor_3.person_id)
    assert subscription_3.type == :invited
    assert subscription_3.canceled == false
  end

  test "does not create duplicate subscriptions for contributors who already have them", ctx do
    # Verify initial subscriptions exist
    assert {:ok, _} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_1.person_id)

    # Count initial subscriptions
    initial_count = count_subscriptions(ctx.project_1.subscription_list_id, ctx.contributor_1.person_id)

    Change085CreateSubscriptionsForProjectContributors.run()

    # Verify no duplicate subscriptions were created
    final_count = count_subscriptions(ctx.project_1.subscription_list_id, ctx.contributor_1.person_id)
    assert initial_count == final_count
  end

  test "handles projects without subscription lists", ctx do
    # Create a project and remove its subscription list
    ctx = Factory.add_project(ctx, :project_3, :space)
    ctx = Factory.add_project_contributor(ctx, :contributor_4, :project_3)

    project = Repo.get!(Operately.Projects.Project, ctx.project_3.id)
    Repo.update_all(
      from(p in Operately.Projects.Project, where: p.id == ^project.id),
      set: [subscription_list_id: nil]
    )

    # Run the migration - should not raise an error
    assert {:ok, _} = Change085CreateSubscriptionsForProjectContributors.run()
  end

  test "handles soft-deleted projects", ctx do
    # Soft delete a project
    project = Repo.get!(Operately.Projects.Project, ctx.project_1.id)
    {:ok, _} = Repo.soft_delete(project)

    # Delete subscriptions
    delete_subscription(ctx.project_1.subscription_list_id, ctx.contributor_1.person_id)
    delete_subscription(ctx.project_1.subscription_list_id, ctx.contributor_2.person_id)

    Change085CreateSubscriptionsForProjectContributors.run()

    # Verify subscriptions are created even for soft-deleted projects
    assert {:ok, subscription_1} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_1.person_id)
    assert subscription_1.type == :invited

    assert {:ok, subscription_2} = Subscription.get(:system, subscription_list_id: ctx.project_1.subscription_list_id, person_id: ctx.contributor_2.person_id)
    assert subscription_2.type == :invited
  end

  defp delete_subscription(subscription_list_id, person_id) do
    Repo.delete_all(
      from(s in Subscription,
        where: s.subscription_list_id == ^subscription_list_id,
        where: s.person_id == ^person_id
      )
    )
  end

  defp count_subscriptions(subscription_list_id, person_id) do
    Repo.one(
      from(s in Subscription,
        where: s.subscription_list_id == ^subscription_list_id,
        where: s.person_id == ^person_id,
        select: count(s.id)
      )
    )
  end
end
