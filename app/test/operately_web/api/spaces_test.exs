defmodule OperatelyWeb.Api.SpacesTest do
  use OperatelyWeb.TurboCase

  alias Operately.People
  alias OperatelyWeb.Paths

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "search" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:spaces, :search], %{})
    end

    test "it returns spaces matching the query", ctx do
      ctx = Factory.add_space(ctx, :product, name: "Product Space")
      ctx = Factory.add_space(ctx, :marketing, name: "Marketing Space")
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:spaces, :search], %{query: "Product"})
      assert length(res.spaces) == 1
      assert res.spaces |> hd() |> Map.get(:name) == "Product Space"
    end
  end

  describe "list tasks" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:engineering)
      |> Factory.create_space_task(:task, :engineering)
    end

    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:spaces, :list_tasks], %{})
    end

    test "it requires a space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:spaces, :list_tasks], %{})
      assert res.message == "Missing required fields: space_id"
    end

    test "it returns not found for non-existent space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:spaces, :list_tasks], %{
        space_id: Ecto.UUID.generate()
      })
    end

    test "it returns tasks for space creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:spaces, :list_tasks], %{
        space_id: Paths.space_id(ctx.engineering)
      })

      assert length(res.tasks) == 1
      assert hd(res.tasks).id == Paths.task_id(ctx.task)
      assert hd(res.tasks).name == ctx.task.name
    end

    test "it returns tasks for space members with view access", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:space_member, :engineering, permissions: :view_access)
        |> Factory.log_in_person(:space_member)

      assert {200, res} = query(ctx.conn, [:spaces, :list_tasks], %{
        space_id: Paths.space_id(ctx.engineering)
      })

      assert length(res.tasks) == 1
      assert hd(res.tasks).id == Paths.task_id(ctx.task)
    end

    test "it returns empty list when space has no tasks", ctx do
      ctx =
        ctx
        |> Factory.add_space(:empty_space)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:spaces, :list_tasks], %{
        space_id: Paths.space_id(ctx.empty_space)
      })

      assert res.tasks == []
    end

    test "it returns multiple tasks when space has multiple tasks", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:task2, :engineering)
        |> Factory.create_space_task(:task3, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:spaces, :list_tasks], %{
        space_id: Paths.space_id(ctx.engineering)
      })

      assert length(res.tasks) == 3
      task_ids = Enum.map(res.tasks, & &1.id)
      assert Paths.task_id(ctx.task) in task_ids
      assert Paths.task_id(ctx.task2) in task_ids
      assert Paths.task_id(ctx.task3) in task_ids
    end
  end

  describe "list members" do
    setup ctx do
      ctx |> Factory.add_space(:space)
    end

    test "it requires authentication", ctx do
      assert {401, _} =
               query(ctx.conn, [:spaces, :list_members], %{space_id: Paths.space_id(ctx.space)})
    end

    test "it requires a space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:spaces, :list_members], %{})
      assert res.message == "Missing required fields: space_id"
    end

    test "it returns an empty list when the person cannot view the space", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:outsider)
        |> Factory.log_in_person(:outsider)

      assert {200, res} =
               query(ctx.conn, [:spaces, :list_members], %{space_id: Paths.space_id(ctx.space)})

      assert res.people == []
    end

    test "it returns all members for authorized people", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:member1, :space, name: "Alice Example")
        |> Factory.add_space_member(:member2, :space, name: "Bob Builder")
        |> Factory.log_in_person(:creator)

      assert {200, res} =
               query(ctx.conn, [:spaces, :list_members], %{space_id: Paths.space_id(ctx.space)})

      ids = Enum.map(res.people, & &1.id)

      assert Paths.person_id(ctx.creator) in ids
      assert Paths.person_id(ctx.member1) in ids
      assert Paths.person_id(ctx.member2) in ids
    end

    test "it filters members by query across names and titles", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:member1, :space, name: "Alice Example")
        |> Factory.add_space_member(:member2, :space, name: "Bob Builder")
        |> Factory.add_space_member(:member3, :space, name: "Charlie Writer")
        |> Factory.log_in_person(:creator)

      {:ok, member3} = People.update_person(ctx.member3, %{title: "Designer"})
      ctx = Map.put(ctx, :member3, member3)

      assert {200, name_res} =
               query(ctx.conn, [:spaces, :list_members], %{
                 space_id: Paths.space_id(ctx.space),
                 query: "alice"
               })

      assert Enum.map(name_res.people, & &1.id) == [Paths.person_id(ctx.member1)]

      assert {200, title_res} =
               query(ctx.conn, [:spaces, :list_members], %{
                 space_id: Paths.space_id(ctx.space),
                 query: "designer"
               })

      assert Enum.map(title_res.people, & &1.id) == [Paths.person_id(ctx.member3)]
    end

    test "it excludes ignored ids and suspended members", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:member1, :space, name: "Alice Example")
        |> Factory.add_space_member(:member2, :space, name: "Bob Builder")
        |> Factory.log_in_person(:creator)
        |> Factory.suspend_company_member(:member2)

      assert {200, res} =
               query(ctx.conn, [:spaces, :list_members], %{
                 space_id: Paths.space_id(ctx.space),
                 ignored_ids: [Paths.person_id(ctx.member1)]
               })

      ids = Enum.map(res.people, & &1.id)

      refute Paths.person_id(ctx.member1) in ids
      refute Paths.person_id(ctx.member2) in ids
      assert Paths.person_id(ctx.creator) in ids
    end
  end

  describe "update task statuses" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{})
    end

    test "it requires a space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        task_statuses: [
          %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
        ]
      })

      assert res.message == "Missing required fields: space_id"
    end

    test "it requires at least one task status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: []
      })

      assert res.message == "At least one task status is required"
    end

    test "it updates task statuses for the space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_progress", label: "In progress", color: "blue", index: 1, value: "in_progress", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: false}
      ]

      assert {200, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: statuses
      })

      assert res.success == true

      space = Repo.reload(ctx.space)

      assert length(space.task_statuses) == 3
      assert Enum.map(space.task_statuses, & &1.label) == ["Todo", "In progress", "Done"]
    end

    test "validation fails when replacement status does not exist in new statuses", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {400, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "old_status", replacement_status_id: "nonexistent"}
        ]
      })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "validation fails when replacement status is also being deleted", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
      ]

      assert {400, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "status_a", replacement_status_id: "status_b"},
          %{deleted_status_id: "status_b", replacement_status_id: "todo"}
        ]
      })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "tasks with deleted statuses are updated to replacement status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "blocked", label: "Blocked", color: "red", index: 2, value: "blocked", closed: false},
        %{id: "done", label: "Done", color: "green", index: 3, value: "done", closed: true}
      ]

      assert {200, _} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: old_statuses
      })

      space = Repo.reload(ctx.space)
      in_review_status = Enum.find(space.task_statuses, & &1.id == "in_review")
      blocked_status = Enum.find(space.task_statuses, & &1.id == "blocked")
      done_status = Enum.find(space.task_statuses, & &1.id == "done")

      task_in_review = Operately.TasksFixtures.task_fixture(%{
        creator_id: ctx.creator.id,
        space_id: ctx.space.id,
        task_status: Map.from_struct(in_review_status)
      })

      task_blocked = Operately.TasksFixtures.task_fixture(%{
        creator_id: ctx.creator.id,
        space_id: ctx.space.id,
        task_status: Map.from_struct(blocked_status)
      })

      task_done = Operately.TasksFixtures.task_fixture(%{
        creator_id: ctx.creator.id,
        space_id: ctx.space.id,
        task_status: Map.from_struct(done_status)
      })

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "in_review"

      task_blocked = Repo.reload(task_blocked)
      assert task_blocked.task_status.id == "blocked"

      task_done = Repo.reload(task_done)
      assert task_done.task_status.id == "done"

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {200, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "in_review", replacement_status_id: "todo"},
          %{deleted_status_id: "blocked", replacement_status_id: "todo"}
        ]
      })

      assert res.success == true

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "todo"

      task_blocked = Repo.reload(task_blocked)
      assert task_blocked.task_status.id == "todo"

      task_done = Repo.reload(task_done)
      assert task_done.task_status.id == "done"
    end

    test "it can add a new status and use it as a replacement for a deleted status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, _} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: old_statuses
      })

      space = Repo.reload(ctx.space)
      in_review_status = Enum.find(space.task_statuses, & &1.id == "in_review")

      task_in_review = Operately.TasksFixtures.task_fixture(%{
        creator_id: ctx.creator.id,
        space_id: ctx.space.id,
        task_status: Map.from_struct(in_review_status)
      })

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "in_review"

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "triage", label: "Triage", color: "red", index: 1, value: "triage", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "in_review", replacement_status_id: "triage"}
        ]
      })

      assert res.success == true

      space = Repo.reload(ctx.space)
      assert Enum.any?(space.task_statuses, &(&1.id == "triage"))

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "triage"
      assert task_in_review.task_status.label == "Triage"
    end

    test "it returns forbidden when the person cannot edit the space", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:outsider)
        |> Factory.log_in_person(:outsider)

      statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
      ]

      assert {403, _res} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{
        space_id: Paths.space_id(ctx.space),
        task_statuses: statuses
      })
    end
  end
end
