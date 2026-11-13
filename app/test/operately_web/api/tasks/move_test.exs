defmodule OperatelyWeb.Api.Tasks.MoveTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Notifications.Notification
  alias Operately.Tasks.Task

  @project_permissions_table [
    %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
    %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
    %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
    %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

    %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
    %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
    %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

    %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
    %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
    %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
  ]

  @space_permissions_table [
    %{company: :no_access,      space: :no_access,      expected: 404},
    %{company: :no_access,      space: :comment_access, expected: 403},
    %{company: :no_access,      space: :edit_access,    expected: 200},
    %{company: :no_access,      space: :full_access,    expected: 200},

    %{company: :comment_access, space: :no_access,      expected: 403},
    %{company: :edit_access,    space: :no_access,      expected: 200},
    %{company: :full_access,    space: :no_access,      expected: 200},
  ]

  @origin_project_permissions_table for row <- @project_permissions_table, destination_type <- [:project, :space], do: Map.put(row, :destination_type, destination_type)
  @origin_space_permissions_table for row <- @space_permissions_table, destination_type <- [:project, :space], do: Map.put(row, :destination_type, destination_type)
  @destination_project_permissions_table for row <- @project_permissions_table, origin_type <- [:project, :space], do: Map.put(row, :origin_type, origin_type)
  @destination_space_permissions_table for row <- @space_permissions_table, origin_type <- [:project, :space], do: Map.put(row, :origin_type, origin_type)

  test "publishes to both projects on a move and neither on failure", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:origin, :space)
      |> Factory.add_project(:destination, :space) |> Factory.add_project_milestone(:milestone, :origin)
      |> Factory.add_project_task(:task, :milestone) |> Factory.log_in_person(:creator)
    origin_topic = "api:project_updated:#{ctx.origin.id}"
    destination_topic = "api:project_updated:#{ctx.destination.id}"
    Enum.each([origin_topic, destination_topic], &OperatelyWeb.Endpoint.subscribe/1)
    inputs = %{task_id: Paths.task_id(ctx.task), destination_type: "project", destination_id: Paths.project_id(ctx.destination)}

    assert {200, _} = mutation(ctx.conn, [:tasks, :move], inputs)
    assert_receive %Phoenix.Socket.Broadcast{topic: ^origin_topic, event: "event"}
    assert_receive %Phoenix.Socket.Broadcast{topic: ^destination_topic, event: "event"}
    refute_receive %Phoenix.Socket.Broadcast{event: "event"}
    assert {400, _} = mutation(ctx.conn, [:tasks, :move], inputs)
    refute_receive %Phoenix.Socket.Broadcast{event: "event"}
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :move], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @origin_project_permissions_table do
      test "origin project permissions company=#{@test.company} space=#{@test.space} project=#{@test.project} destination=#{@test.destination_type}", ctx do
        origin = create_task_context(ctx, :project, @test.company, @test.space, @test.project)
        destination = create_destination_with_full_access(ctx, @test.destination_type)

        assert {code, res} = mutation(ctx.conn, [:tasks, :move], %{
          task_id: Paths.task_id(origin.task),
          destination_type: Atom.to_string(@test.destination_type),
          destination_id: encode_destination_id(destination, @test.destination_type)
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            moved_task = Repo.reload(origin.task)
            assert_destination_changed(moved_task, destination, @test.destination_type)

          403 ->
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @origin_space_permissions_table do
      test "origin space permissions company=#{@test.company} space=#{@test.space} destination=#{@test.destination_type}", ctx do
        origin = create_task_context(ctx, :space, @test.company, @test.space, nil)
        destination = create_destination_with_full_access(ctx, @test.destination_type)

        assert {code, res} = mutation(ctx.conn, [:tasks, :move], %{
          task_id: Paths.task_id(origin.task),
          destination_type: Atom.to_string(@test.destination_type),
          destination_id: encode_destination_id(destination, @test.destination_type)
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            moved_task = Repo.reload(origin.task)
            assert_destination_changed(moved_task, destination, @test.destination_type)

          403 ->
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @destination_project_permissions_table do
      test "destination project permissions company=#{@test.company} space=#{@test.space} project=#{@test.project} origin=#{@test.origin_type}", ctx do
        origin = create_task_context(ctx, @test.origin_type, :full_access, :full_access, :full_access)

        destination_space = create_space(ctx, :no_access)
        destination_project = create_project(ctx, destination_space, @test.company, @test.space, @test.project)

        assert {code, res} = mutation(ctx.conn, [:tasks, :move], %{
          task_id: Paths.task_id(origin.task),
          destination_type: "project",
          destination_id: Paths.project_id(destination_project)
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            moved_task = Repo.reload(origin.task)
            assert moved_task.project_id == destination_project.id
            assert moved_task.space_id == nil

          403 ->
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @destination_space_permissions_table do
      test "destination space permissions company=#{@test.company} space=#{@test.space} origin=#{@test.origin_type}", ctx do
        origin = create_task_context(ctx, @test.origin_type, :full_access, :full_access, :full_access)

        destination_space = create_space_with_permissions(ctx, @test.company, @test.space)

        assert {code, res} = mutation(ctx.conn, [:tasks, :move], %{
          task_id: Paths.task_id(origin.task),
          destination_type: "space",
          destination_id: Paths.space_id(destination_space)
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            moved_task = Repo.reload(origin.task)
            assert moved_task.project_id == nil
            assert moved_task.space_id == destination_space.id

          403 ->
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "move_task functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    test "moves task from project to project and resets status to destination default", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space(ctx, :no_access)
      destination_project = create_project(ctx, destination_space, :full_access, :full_access, :full_access)
      destination_project = set_project_statuses(destination_project, [status("In progress", :blue, "in_progress"), status("Done", :green, "done", closed: true)])

      assert {200, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "project",
        destination_id: Paths.project_id(destination_project)
      })

      task = Repo.reload(origin.task)
      default = Operately.Projects.Project.get_default_task_status(destination_project)

      assert task.project_id == destination_project.id
      assert task.space_id == nil
      assert task.milestone_id == nil
      assert Task.task_type(task) == "project"
      assert task.task_status.value == default.value
      assert to_string(res.destination_type) == "project"
      assert res.destination_id == Paths.project_id(destination_project)
      assert res.task.type == "project"
    end

    test "moves task from project to space and changes task type", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)
      destination_space = set_space_statuses(destination_space, [status("Ready", :gray, "ready"), status("Done", :green, "done", closed: true)])

      assert {200, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      task = Repo.reload(origin.task)
      default = Operately.Tasks.TaskBoard.get_default_task_status(Repo.get!(Operately.Tasks.TaskBoard, destination_space.default_task_board_id))

      assert task.project_id == nil
      assert task.space_id == destination_space.id
      assert task.milestone_id == nil
      assert Task.task_type(task) == "space"
      assert task.task_status.value == default.value
      assert to_string(res.destination_type) == "space"
      assert res.destination_id == Paths.space_id(destination_space)
      assert res.task.type == "space"
    end

    test "moves task from space to project and changes task type", ctx do
      origin = create_task_context(ctx, :space, :full_access, :full_access, nil)
      destination_space = create_space(ctx, :no_access)
      destination_project = create_project(ctx, destination_space, :full_access, :full_access, :full_access)

      assert {200, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "project",
        destination_id: Paths.project_id(destination_project)
      })

      task = Repo.reload(origin.task)
      default = Operately.Projects.Project.get_default_task_status(destination_project)

      assert task.project_id == destination_project.id
      assert task.space_id == nil
      assert task.board_id == Operately.Projects.Project.task_board(destination_project).id

      board = Repo.get!(Operately.Tasks.TaskBoard, origin.task.board_id)

      refute Paths.task_id(task) in (board.tasks_kanban_state |> Map.values() |> List.flatten())
      assert task.milestone_id == nil
      assert Task.task_type(task) == "project"
      assert task.task_status.value == default.value
      assert to_string(res.destination_type) == "project"
      assert res.destination_id == Paths.project_id(destination_project)
      assert res.task.type == "project"
    end

    test "moves task from space to space", ctx do
      origin = create_task_context(ctx, :space, :full_access, :full_access, nil)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)

      assert {200, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      task = Repo.reload(origin.task)
      default = Operately.Tasks.TaskBoard.get_default_task_status(Repo.get!(Operately.Tasks.TaskBoard, destination_space.default_task_board_id))

      assert task.project_id == nil
      assert task.space_id == destination_space.id
      assert task.board_id == destination_space.default_task_board_id

      origin_board = Repo.get!(Operately.Tasks.TaskBoard, origin.task.board_id)
      destination_board = Repo.get!(Operately.Tasks.TaskBoard, task.board_id)

      refute Paths.task_id(task) in (origin_board.tasks_kanban_state |> Map.values() |> List.flatten())
      assert Paths.task_id(task) in destination_board.tasks_kanban_state[task.task_status.value]
      assert task.milestone_id == nil
      assert Task.task_type(task) == "space"
      assert task.task_status.value == default.value
      assert to_string(res.destination_type) == "space"
      assert res.destination_id == Paths.space_id(destination_space)
      assert res.task.type == "space"
    end

    test "returns bad request for same destination", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)

      assert {400, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "project",
        destination_id: Paths.project_id(origin.project)
      })

      assert res.message == "The request was malformed"
    end

    test "returns bad request when destination project is not active", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space(ctx, :no_access)
      destination_project = create_project(ctx, destination_space, :full_access, :full_access, :full_access)
      {:ok, destination_project} = Operately.Projects.update_project(destination_project, %{status: "paused"})

      assert {400, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "project",
        destination_id: Paths.project_id(destination_project)
      })

      assert res.message == "The request was malformed"
    end

    test "returns bad request when destination space has tasks disabled", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)
      {:ok, destination_space} = Operately.Groups.update_group(destination_space, %{tools: %{tasks_enabled: false}})

      assert {400, res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      assert res.message == "The request was malformed"
    end

    test "creates task_moving activity with expected content", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)

      assert {200, _res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      activity =
        from(a in Activity, where: a.action == "task_moving", order_by: [desc: a.inserted_at], limit: 1)
        |> Repo.one()

      assert activity.content["task_id"] == origin.task.id
      assert activity.content["task_name"] == origin.task.name
      assert activity.content["origin_type"] == "project"
      assert activity.content["destination_type"] == "space"
      assert activity.content["origin_project_id"] == origin.project.id
      assert activity.content["origin_space_id"] == origin.space.id
      assert activity.content["destination_project_id"] == nil
      assert activity.content["destination_space_id"] == destination_space.id
      assert activity.content["project_id"] == nil
      assert activity.content["space_id"] == destination_space.id
    end

    test "creates email-enabled notifications for task subscribers", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)

      subscriber1 = person_fixture(%{company_id: ctx.company.id})
      subscriber2 = person_fixture(%{company_id: ctx.company.id})

      {:ok, _} = Operately.Groups.add_members(ctx.creator, destination_space.id, [
        %{id: subscriber1.id, access_level: Binding.view_access()},
        %{id: subscriber2.id, access_level: Binding.view_access()}
      ])

      {:ok, _} = Operately.Notifications.create_subscription(%{
        subscription_list_id: origin.task.subscription_list_id,
        person_id: subscriber1.id,
        type: :joined
      })

      {:ok, _} = Operately.Notifications.create_subscription(%{
        subscription_list_id: origin.task.subscription_list_id,
        person_id: subscriber2.id,
        type: :joined
      })

      assert {200, _res} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      activity =
        from(a in Activity, where: a.action == "task_moving", order_by: [desc: a.inserted_at], limit: 1)
        |> Repo.one()

      notifications =
        from(n in Notification, where: n.activity_id == ^activity.id)
        |> Repo.all()

      ids = Enum.map(notifications, & &1.person_id)

      assert subscriber1.id in ids
      assert subscriber2.id in ids
      assert Enum.all?(notifications, & &1.should_send_email)
    end
  end

  describe "project-to-space status selection" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.enable_space_tool(:space, :tasks)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_space(:destination_space)
      |> Factory.enable_space_tool(:destination_space, :tasks)
    end

    test "preserves an equivalent open status using destination metadata", ctx do
      source_status = Enum.find(ctx.project.task_statuses, &(&1.value == "in_progress"))
      closed_status = Enum.find(ctx.project.task_statuses, &(&1.value == "done"))

      destination_space =
        set_space_statuses(ctx.destination_space, [
          status("Ready", :gray, "ready"),
          status("Underway", :blue, "in_progress")
        ])

      destination_status = Enum.find(destination_space.default_task_board.task_statuses, &(&1.value == "in_progress"))
      {:ok, closed_task} = Operately.Tasks.update_task(ctx.task, Task.status_change_attrs(ctx.task, closed_status))
      {:ok, task} = Operately.Tasks.update_task(closed_task, Task.status_change_attrs(closed_task, source_status))

      assert task.reopened_at
      assert {200, res} = move_to_space(ctx.conn, task, destination_space)

      moved_task = Repo.reload(task)

      assert moved_task.id == task.id
      assert_status_matches(moved_task.task_status, destination_status)
      assert moved_task.status == "in_progress"
      assert moved_task.closed_at == task.closed_at
      assert moved_task.reopened_at == task.reopened_at
      assert res.task.status.id == destination_status.id
      assert res.task.status.value == destination_status.value
      assert res.task.status.closed == destination_status.closed
    end

    test "preserves an equivalent closed status and closure timestamps when moving to the project's space", ctx do
      source_status = Enum.find(ctx.project.task_statuses, &(&1.value == "done"))
      destination_status = Enum.find(Repo.get!(Operately.Tasks.TaskBoard, ctx.space.default_task_board_id).task_statuses, &(&1.value == "done"))
      {:ok, task} = Operately.Tasks.update_task(ctx.task, Task.status_change_attrs(ctx.task, source_status))
      origin_topic = "api:project_updated:#{ctx.project.id}"
      OperatelyWeb.Endpoint.subscribe(origin_topic)

      assert {200, _res} = move_to_space(ctx.conn, task, ctx.space)
      assert_receive %Phoenix.Socket.Broadcast{topic: ^origin_topic, event: "event"}
      refute_receive %Phoenix.Socket.Broadcast{event: "event"}

      moved_task = Repo.reload(task)

      assert_status_matches(moved_task.task_status, destination_status)
      assert moved_task.status == "done"
      assert moved_task.closed_at == task.closed_at
      assert moved_task.reopened_at == task.reopened_at
    end

    test "uses the destination default and reopens a closed task when no equivalent status exists", ctx do
      source_status = Enum.find(ctx.project.task_statuses, &(&1.value == "done"))
      destination_space = set_space_statuses(ctx.destination_space, [status("Ready", :gray, "ready")])
      destination_status = hd(destination_space.default_task_board.task_statuses)
      {:ok, task} = Operately.Tasks.update_task(ctx.task, Task.status_change_attrs(ctx.task, source_status))

      assert task.closed_at
      refute task.reopened_at
      assert {200, _res} = move_to_space(ctx.conn, task, destination_space)

      moved_task = Repo.reload(task)

      assert_status_matches(moved_task.task_status, destination_status)
      assert moved_task.status == "ready"
      refute moved_task.closed_at
      assert moved_task.reopened_at
    end

    test "does not match a destination status with different closed meaning", ctx do
      source_status = Enum.find(ctx.project.task_statuses, &(&1.value == "done"))

      destination_space =
        set_space_statuses(ctx.destination_space, [
          status("Ready", :gray, "ready"),
          status("Still active", :blue, "done")
        ])

      {:ok, task} = Operately.Tasks.update_task(ctx.task, Task.status_change_attrs(ctx.task, source_status))

      assert {200, _res} = move_to_space(ctx.conn, task, destination_space)

      moved_task = Repo.reload(task)

      assert moved_task.task_status.value == "ready"
      refute moved_task.task_status.closed
      refute moved_task.closed_at
      assert moved_task.reopened_at
    end
  end

  describe "explicit board destinations" do
    setup ctx do
      ctx = ctx |> Factory.setup() |> Factory.add_space(:board_space) |> Factory.set_space_tools(:board_space, tasks_enabled: true) |> Factory.create_space_task(:board_task, :board_space) |> Factory.log_in_person(:creator)
      board = Repo.insert!(%Operately.Tasks.TaskBoard{space_id: ctx.board_space.id, name: "Other", task_statuses: Repo.get!(Operately.Tasks.TaskBoard, ctx.board_space.default_task_board_id).task_statuses})
      Map.put(ctx, :board, board)
    end

    test "moves within a space and updates both boards and activity context", ctx do
      assert {200, response} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(ctx.board_task), destination_type: "space", destination_id: Paths.space_id(ctx.board_space), destination_board_id: ctx.board.id
      })
      assert response.board_id == Operately.ShortUuid.encode!(ctx.board.id)
      task = Repo.reload!(ctx.board_task)
      assert task.board_id == ctx.board.id
      source = Repo.get!(Operately.Tasks.TaskBoard, ctx.board_space.default_task_board_id)
      refute Paths.task_id(task) in List.flatten(Map.values(source.tasks_kanban_state))
      assert Paths.task_id(task) in List.flatten(Map.values(Repo.reload!(ctx.board).tasks_kanban_state))
      activity = Repo.one!(from a in Activity, where: a.action == "task_moving" and a.content["task_id"] == ^task.id)
      assert activity.content["origin_board_id"] == source.id
      assert activity.content["destination_board_id"] == ctx.board.id
    end

    test "updates completion when a matching status ID has a different closed state", ctx do
      status = ctx.board_task.task_status |> Map.from_struct() |> Map.put(:closed, true)
      ctx.board |> Operately.Tasks.TaskBoard.changeset(%{task_statuses: [status]}) |> Repo.update!()

      assert {200, _} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: Paths.task_id(ctx.board_task),
        destination_type: "space",
        destination_id: Paths.space_id(ctx.board_space),
        destination_board_id: ctx.board.id
      })

      task = Repo.reload!(ctx.board_task)
      assert task.task_status.closed
      assert task.closed_at
    end

    test "requires a mapping for incompatible statuses and rolls back before retry", ctx do
      status = %{id: "review", value: "review", label: "Review", color: :blue, index: 0, closed: false}
      ctx.board |> Operately.Tasks.TaskBoard.changeset(%{task_statuses: [status]}) |> Repo.update!()
      inputs = %{task_id: Paths.task_id(ctx.board_task), destination_type: "space", destination_id: Paths.space_id(ctx.board_space), destination_board_id: ctx.board.id}
      source = Repo.get!(Operately.Tasks.TaskBoard, ctx.board_space.default_task_board_id)
      assert {400, response} = mutation(ctx.conn, [:tasks, :move], inputs)
      assert response.details.code == "task_board_status_mapping_required"
      assert [%{id: "review"}] = response.details.task_statuses
      assert Repo.reload!(ctx.board_task).board_id == source.id
      assert Repo.reload!(source).tasks_kanban_state == source.tasks_kanban_state
      assert {200, response} = mutation(ctx.conn, [:tasks, :move], Map.put(inputs, :destination_status_id, "review"))
      assert response.task.status.id == "review"
    end

    test "rejects moves out of an archived board without changing either ordering", ctx do
      source = Repo.get!(Operately.Tasks.TaskBoard, ctx.board_task.board_id)
      source = source |> Ecto.Changeset.change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
      assert {400, %{details: %{code: "task_board_archived"}}} = mutation(ctx.conn, [:tasks, :move], %{
        task_id: ctx.board_task.id, destination_type: "space", destination_id: ctx.board_space.id, destination_board_id: ctx.board.id
      })
      assert Repo.reload!(ctx.board_task).board_id == source.id
      assert Repo.reload!(source).tasks_kanban_state == source.tasks_kanban_state
      assert Repo.reload!(ctx.board).tasks_kanban_state == ctx.board.tasks_kanban_state
    end

    test "rejects current-board, mismatched-space, and archived destinations", ctx do
      inputs = %{task_id: Paths.task_id(ctx.board_task), destination_type: "space", destination_id: Paths.space_id(ctx.board_space)}
      assert {400, _} = mutation(ctx.conn, [:tasks, :move], Map.put(inputs, :destination_board_id, ctx.board_space.default_task_board_id))
      ctx = Factory.add_space(ctx, :another_space)
      assert {400, _} = mutation(ctx.conn, [:tasks, :move], Map.put(inputs, :destination_board_id, ctx.another_space.default_task_board_id))
      ctx.board |> Ecto.Changeset.change(archived_at: ~N[2026-01-01 00:00:00]) |> Repo.update!()
      assert {400, error} = mutation(ctx.conn, [:tasks, :move], Map.put(inputs, :destination_board_id, ctx.board.id))
      assert error.details.code == "task_board_archived"
    end
  end

  defp assert_destination_changed(task, destination, :project) do
    assert task.project_id == destination.id
    assert task.space_id == nil
  end

  defp assert_destination_changed(task, destination, :space) do
    assert task.project_id == nil
    assert task.space_id == destination.id
  end

  #
  # Helpers
  #

  defp create_task_context(ctx, :project, company_members_level, space_members_level, project_member_level) do
    space = create_space(ctx, :no_access)
    project = create_project(ctx, space, company_members_level, space_members_level, project_member_level)
    milestone = milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

    task =
      task_fixture(%{
        creator_id: ctx.creator.id,
        project_id: project.id,
        milestone_id: milestone.id,
        name: "Project Task"
      })

    %{space: space, project: project, milestone: milestone, task: task}
  end

  defp create_task_context(ctx, :space, company_members_level, space_members_level, _) do
    space = create_space_with_permissions(ctx, company_members_level, space_members_level)

    task =
      task_fixture(%{
        creator_id: ctx.creator.id,
        space_id: space.id,
        name: "Space Task"
      })

    %{space: space, task: task}
  end

  defp create_destination_with_full_access(ctx, :project) do
    space = create_space(ctx, :no_access)
    create_project(ctx, space, :full_access, :full_access, :full_access)
  end

  defp create_destination_with_full_access(ctx, :space) do
    create_space_with_permissions(ctx, :full_access, :full_access)
  end

  defp encode_destination_id(destination, :project), do: Paths.project_id(destination)
  defp encode_destination_id(destination, :space), do: Paths.space_id(destination)

  defp create_space(ctx, company_permissions) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(company_permissions)
    })
  end

  defp create_space_with_permissions(ctx, company_members_level, space_members_level) do
    space = create_space(ctx, company_members_level)

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    {:ok, space} = Operately.Groups.update_group(space, %{tools: %{tasks_enabled: true}})

    space
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    if project_member_level != :no_access do
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_member_level),
        responsibility: "Task mover"
      })
    end

    project
  end

  defp set_project_statuses(project, statuses) do
    statuses =
      statuses
      |> Enum.with_index()
      |> Enum.map(fn {status, index} -> Map.put(status, :index, index) end)

    {:ok, project} = Operately.Projects.update_project(project, %{task_statuses: statuses})
    project
  end

  defp set_space_statuses(space, statuses) do
    statuses =
      statuses
      |> Enum.with_index()
      |> Enum.map(fn {status, index} -> Map.put(status, :index, index) end)

    board = Repo.get!(Operately.Tasks.TaskBoard, space.default_task_board_id)
    {:ok, board} = board |> Operately.Tasks.TaskBoard.changeset(%{task_statuses: statuses}) |> Repo.update()
    %{space | default_task_board: board}
  end

  defp status(label, color, value, opts \\ []) do
    %{
      id: Ecto.UUID.generate(),
      label: label,
      color: color,
      value: value,
      index: 0,
      closed: Keyword.get(opts, :closed, false)
    }
  end

  defp move_to_space(conn, task, destination_space) do
    mutation(conn, [:tasks, :move], %{
      task_id: Paths.task_id(task),
      destination_type: "space",
      destination_id: Paths.space_id(destination_space)
    })
  end

  defp assert_status_matches(actual, expected) do
    fields = [:id, :label, :color, :index, :value, :closed]

    assert Map.take(actual, fields) == Map.take(expected, fields)
  end

end
