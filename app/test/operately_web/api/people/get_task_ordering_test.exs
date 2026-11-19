defmodule OperatelyWeb.Api.People.GetTaskOrderingTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:member)
    |> Factory.add_space(:space)
    |> Factory.create_space_task(:first_task, :space)
    |> Factory.add_task_assignee(:first_assignment, :first_task, :creator)
    |> Factory.create_space_task(:second_task, :space)
    |> Factory.add_task_assignee(:second_assignment, :second_task, :creator)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:people, :get_task_ordering], %{})
    end

    test "it does not return another person's order", ctx do
      ctx =
        ctx
        |> Factory.add_task_assignee(:member_assignment, :first_task, :member)
        |> Factory.log_in_person(:member)

      {:ok, _} = Operately.People.update_person(ctx.creator, %{preferences: %{task_ordering: [ctx.first_task.id]}})

      assert {200, %{task_ids: []}} = query(ctx.conn, [:people, :get_task_ordering], %{})
    end
  end

  describe "get_task_ordering functionality" do
    setup ctx do
      Factory.log_in_person(ctx, :creator)
    end

    test "it returns an empty list when no order is saved", ctx do
      assert {200, %{task_ids: []}} = query(ctx.conn, [:people, :get_task_ordering], %{})
    end

    test "it returns the saved task order", ctx do
      ids = [ctx.second_task.id, ctx.first_task.id]
      {:ok, _} = Operately.People.update_person(ctx.creator, %{preferences: %{task_ordering: ids}})

      assert {200, res} = query(ctx.conn, [:people, :get_task_ordering], %{})
      assert res.task_ids == Enum.map(ids, &Operately.ShortUuid.encode!/1)
    end

    test "it ignores tasks that are no longer assigned", ctx do
      {:ok, _} = Operately.People.update_person(ctx.creator, %{preferences: %{task_ordering: [ctx.first_task.id, ctx.second_task.id]}})
      Repo.delete!(ctx.first_assignment)

      assert {200, res} = query(ctx.conn, [:people, :get_task_ordering], %{})
      assert res.task_ids == [Operately.ShortUuid.encode!(ctx.second_task.id)]
    end
  end
end
