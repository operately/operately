defmodule OperatelyWeb.Api.People.UpdateTaskOrderingTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:member)
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:project_task, :milestone)
    |> Factory.add_task_assignee(:project_assignment, :project_task, :creator)
    |> Factory.create_space_task(:space_task, :space)
    |> Factory.add_task_assignee(:space_assignment, :space_task, :creator)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: []})
    end
  end

  describe "permissions" do
    test "it rejects assigned tasks without view access", ctx do
      ctx =
        ctx
        |> Factory.add_task_assignee(:member_assignment, :project_task, :member)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.log_in_person(:member)

      assert {400, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [Paths.task_id(ctx.project_task)]})
      assert Repo.reload!(ctx.member).preferences.task_ordering == []
    end

    test "it saves the displayed task order after access to another assigned task is revoked", ctx do
      ctx =
        ctx
        |> Factory.add_task_assignee(:member_project_assignment, :project_task, :member)
        |> Factory.add_space(:public_space, company_permissions: Operately.Access.Binding.view_access())
        |> Factory.create_space_task(:first_space_task, :public_space)
        |> Factory.add_task_assignee(:member_space_assignment, :first_space_task, :member)
        |> Factory.create_space_task(:second_space_task, :public_space)
        |> Factory.add_task_assignee(:second_space_assignment, :second_space_task, :member)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.log_in_person(:member)

      {:ok, work_map} = Operately.WorkMaps.GetWorkMapQuery.execute(ctx.member, %{
        company_id: ctx.company.id,
        contributor_id: ctx.member.id,
        include_tasks: true
      }, :flat)

      ids = for item <- work_map, item.type == :task, do: item.id
      assert Enum.sort(ids) == Enum.sort([ctx.first_space_task.id, ctx.second_space_task.id])
      reordered_ids = Enum.reverse(ids)

      assert {200, res} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: reordered_ids})
      assert res.task_ids == Enum.map(reordered_ids, &Operately.ShortUuid.encode!/1)
      assert Repo.reload!(ctx.member).preferences.task_ordering == reordered_ids
    end

    test "it does not change another person's order", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      {:ok, _} = Operately.People.update_person(ctx.member, %{preferences: %{task_ordering: [ctx.space_task.id]}})

      assert {200, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [Paths.task_id(ctx.project_task)]})
      assert Repo.reload!(ctx.member).preferences.task_ordering == [ctx.space_task.id]
    end
  end

  describe "update_task_ordering functionality" do
    setup ctx do
      Factory.log_in_person(ctx, :creator)
    end

    test "it saves the task order", ctx do
      ids = [Paths.task_id(ctx.space_task), Paths.task_id(ctx.project_task)]

      assert {200, res} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: ids})
      assert res.task_ids == Enum.map([ctx.space_task, ctx.project_task], &Operately.ShortUuid.encode!(&1.id))
      assert Repo.reload!(ctx.creator).preferences.task_ordering == [ctx.space_task.id, ctx.project_task.id]
    end

    test "it preserves shared ordering and other preferences", ctx do
      {:ok, _} = Operately.People.update_person(ctx.creator, %{preferences: %{time_format: :hour_24}})

      assert {200, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [Paths.task_id(ctx.project_task)]})
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ctx.milestone.tasks_ordering_state
      assert Repo.reload!(ctx.project).tasks_kanban_state == ctx.project.tasks_kanban_state
      assert Operately.People.Person.time_format(Repo.reload!(ctx.creator)) == :hour_24
    end

    test "it accepts an empty task order", ctx do
      {:ok, _} = Operately.People.update_person(ctx.creator, %{preferences: %{task_ordering: [ctx.project_task.id]}})

      assert {200, %{task_ids: []}} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: []})
      assert Repo.reload!(ctx.creator).preferences.task_ordering == []
    end

    test "it rejects unassigned tasks", ctx do
      ctx = Factory.create_space_task(ctx, :unassigned_task, :space)

      assert {400, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [Paths.task_id(ctx.unassigned_task)]})
      assert Repo.reload!(ctx.creator).preferences.task_ordering == []
    end

    test "it rejects missing tasks", ctx do
      assert {400, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [Ecto.UUID.generate()]})
      assert Repo.reload!(ctx.creator).preferences.task_ordering == []
    end

    test "it rejects duplicate tasks", ctx do
      id = Paths.task_id(ctx.project_task)

      assert {400, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [id, id]})
      assert Repo.reload!(ctx.creator).preferences.task_ordering == []
    end

    test "it rejects closed tasks", ctx do
      {:ok, _} = Operately.Tasks.update_task(ctx.project_task, %{closed_at: NaiveDateTime.utc_now()})

      assert {400, _} = mutation(ctx.conn, [:people, :update_task_ordering], %{task_ids: [Paths.task_id(ctx.project_task)]})
      assert Repo.reload!(ctx.creator).preferences.task_ordering == []
    end
  end
end
