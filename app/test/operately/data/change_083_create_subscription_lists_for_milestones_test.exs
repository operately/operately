defmodule Operately.Data.Change083CreateSubscriptionListsForMilestonesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    ctx =
      Enum.reduce(1..3, ctx, fn num, ctx ->
        milestone_name = resource_name("milestone", num)

        ctx
        |> Factory.add_project_milestone(milestone_name, :project)
        |> reset_milestone_subscription_list(milestone_name)
      end)

    {:ok, ctx}
  end

  test "creates subscription lists for existing milestones", ctx do
    milestones = [ctx.milestone_1, ctx.milestone_2, ctx.milestone_3]

    Enum.each(milestones, fn milestone ->
      assert milestone.subscription_list_id == nil
    end)

    Operately.Data.Change083CreateSubscriptionListsForMilestones.run()

    Enum.each(milestones, fn milestone ->
      milestone = Repo.reload(milestone)

      assert milestone.subscription_list_id != nil
      assert {:ok, subscription_list} = SubscriptionList.get(:system, id: milestone.subscription_list_id)
      assert subscription_list.parent_id == milestone.id
      assert subscription_list.parent_type == :project_milestone
    end)
  end

  test "does not create duplicate subscription lists for milestones that already have them", ctx do
    ctx =
      ctx
      |> Factory.add_project_milestone(:milestone_4, :project)
      |> Factory.preload(:milestone_4, :subscription_list)

    assert ctx.milestone_4.subscription_list_id != nil
    %{subscription_list: subscription_list} = ctx.milestone_4

    Operately.Data.Change083CreateSubscriptionListsForMilestones.run()

    milestone = Repo.reload(ctx.milestone_4)
    assert milestone.subscription_list_id == subscription_list.id

    subscription_lists =
      Repo.all(from(sl in SubscriptionList, where: sl.parent_id == ^milestone.id, where: sl.parent_type == :project_milestone))

    assert length(subscription_lists) == 1
  end

  defp resource_name(name, num) do
    String.to_atom("#{name}_#{num}")
  end

  defp reset_milestone_subscription_list(ctx, milestone_name) do
    milestone = ctx[milestone_name]

    Repo.update_all(
      from(m in Operately.Projects.Milestone, where: m.id == ^milestone.id),
      set: [subscription_list_id: nil]
    )

    Repo.delete_all(from(sl in SubscriptionList, where: sl.parent_id == ^milestone.id, where: sl.parent_type == :project_milestone))

    milestone = Repo.reload(milestone)

    Map.put(ctx, milestone_name, milestone)
  end
end
