defmodule Operately.Data.Change080CreateSubscriptionsListForTasksTest do
  use Operately.DataCase

  alias Operately.Notifications.SubscriptionList

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    Enum.reduce(1..3, ctx, fn num, ctx ->
      task_name = resource_name("task", num)

      ctx
      |> Factory.add_project_task(task_name, :milestone)
      |> reset_task_subscription_list(task_name)
    end)
  end

  test "creates subscriptions list for existing tasks", ctx do
    tasks = [ctx.task_1, ctx.task_2, ctx.task_3]

    # Verify tasks don't have subscription lists initially
    Enum.each(tasks, fn task ->
      assert task.subscription_list_id == nil
    end)

    Operately.Data.Change080CreateSubscriptionsListForTasks.run()

    # Verify subscription lists were created and assigned to tasks
    Enum.each(tasks, fn task ->
      task = Repo.reload(task)

      assert task.subscription_list_id != nil
      assert {:ok, subscription_list} = SubscriptionList.get(:system, id: task.subscription_list_id)
      assert subscription_list.parent_id == task.id
      assert subscription_list.parent_type == :project_task
    end)
  end

  test "does not create duplicate subscription lists for tasks that already have them", ctx do
    ctx =
      ctx
      |> Factory.add_project_task(:task_4, :milestone)
      |> Factory.preload(:task_4, :subscription_list)

    assert ctx.task_4.subscription_list_id != nil
    %{subscription_list: subscription_list} = ctx.task_4

    # Run the migration
    Operately.Data.Change080CreateSubscriptionsListForTasks.run()

    # Verify the existing subscription list is preserved
    task = Repo.reload(ctx.task_4)
    assert task.subscription_list_id == subscription_list.id

    # Verify no duplicate subscription lists were created
    subscription_lists = Repo.all(from(sl in SubscriptionList, where: sl.parent_id == ^task.id))
    assert length(subscription_lists) == 1
  end

  #
  # Helpers
  #

  defp resource_name(name, num) do
    String.to_atom("#{name}_#{num}")
  end

  defp reset_task_subscription_list(ctx, task_name) do
    {1, nil} =
      Repo.update_all(
        from(t in Operately.Tasks.Task, where: t.id == ^ctx[task_name].id),
        set: [subscription_list_id: nil]
      )

    task = Repo.reload(ctx[task_name])
    Map.put(ctx, task_name, task)
  end
end
