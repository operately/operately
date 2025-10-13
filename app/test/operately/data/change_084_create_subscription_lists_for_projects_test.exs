defmodule Operately.Data.Change084CreateSubscriptionListsForProjectsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory

  setup ctx do
    drop_constraint()

    on_exit(fn ->
      restore_constraint()
    end)

    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)

    ctx =
      Enum.reduce(1..3, ctx, fn num, ctx ->
        project_name = resource_name("project", num)

        ctx
        |> Factory.add_project(project_name, :space)
        |> reset_project_subscription_list(project_name)
      end)

    {:ok, ctx}
  end

  test "creates subscription lists for existing projects", ctx do
    projects = [ctx.project_1, ctx.project_2, ctx.project_3]

    Enum.each(projects, fn project ->
      assert project.subscription_list_id == nil
    end)

    Operately.Data.Change084CreateSubscriptionListsForProjects.run()

    Enum.each(projects, fn project ->
      project = Repo.reload(project)

      assert project.subscription_list_id != nil
      assert {:ok, subscription_list} = SubscriptionList.get(:system, id: project.subscription_list_id)
      assert subscription_list.parent_id == project.id
      assert subscription_list.parent_type == :project
    end)
  end

  test "does not create duplicate subscription lists for projects that already have them", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project_4, :space)
      |> Factory.preload(:project_4, :subscription_list)

    assert ctx.project_4.subscription_list_id != nil
    %{subscription_list: subscription_list} = ctx.project_4

    Operately.Data.Change084CreateSubscriptionListsForProjects.run()

    project = Repo.reload(ctx.project_4)
    assert project.subscription_list_id == subscription_list.id

    subscription_lists =
      Repo.all(from(sl in SubscriptionList, where: sl.parent_id == ^project.id, where: sl.parent_type == :project))

    assert length(subscription_lists) == 1
  end

  defp resource_name(name, num) do
    String.to_atom("#{name}_#{num}")
  end

  defp reset_project_subscription_list(ctx, project_name) do
    project = ctx[project_name]

    Repo.update_all(
      from(p in Operately.Projects.Project, where: p.id == ^project.id),
      set: [subscription_list_id: nil]
    )

    Repo.delete_all(from(sl in SubscriptionList, where: sl.parent_id == ^project.id, where: sl.parent_type == :project))

    project = Repo.reload(project)

    Map.put(ctx, project_name, project)
  end

  defp drop_constraint do
    Repo.query!("ALTER TABLE projects ALTER COLUMN subscription_list_id DROP NOT NULL")
  end

  defp restore_constraint do
    Repo.query!("ALTER TABLE projects ALTER COLUMN subscription_list_id SET NOT NULL")
  end
end
