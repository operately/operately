defmodule OperatelyWeb.Api.Mutations.MoveTaskTest do
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

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :move_task, %{})
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

        assert {code, res} = mutation(ctx.conn, :move_task, %{
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

        assert {code, res} = mutation(ctx.conn, :move_task, %{
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

        assert {code, res} = mutation(ctx.conn, :move_task, %{
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

        assert {code, res} = mutation(ctx.conn, :move_task, %{
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

      assert {200, res} = mutation(ctx.conn, :move_task, %{
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

      assert {200, res} = mutation(ctx.conn, :move_task, %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      task = Repo.reload(origin.task)
      default = Operately.Groups.Group.get_default_task_status(destination_space)

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

      assert {200, res} = mutation(ctx.conn, :move_task, %{
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

    test "moves task from space to space", ctx do
      origin = create_task_context(ctx, :space, :full_access, :full_access, nil)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)

      assert {200, res} = mutation(ctx.conn, :move_task, %{
        task_id: Paths.task_id(origin.task),
        destination_type: "space",
        destination_id: Paths.space_id(destination_space)
      })

      task = Repo.reload(origin.task)
      default = Operately.Groups.Group.get_default_task_status(destination_space)

      assert task.project_id == nil
      assert task.space_id == destination_space.id
      assert task.milestone_id == nil
      assert Task.task_type(task) == "space"
      assert task.task_status.value == default.value
      assert to_string(res.destination_type) == "space"
      assert res.destination_id == Paths.space_id(destination_space)
      assert res.task.type == "space"
    end

    test "returns bad request for same destination", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)

      assert {400, res} = mutation(ctx.conn, :move_task, %{
        task_id: Paths.task_id(origin.task),
        destination_type: "project",
        destination_id: Paths.project_id(origin.project)
      })

      assert res.message == "The request was malformed"
    end

    test "creates task_moving activity with expected content", ctx do
      origin = create_task_context(ctx, :project, :full_access, :full_access, :full_access)
      destination_space = create_space_with_permissions(ctx, :full_access, :full_access)

      assert {200, _res} = mutation(ctx.conn, :move_task, %{
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

      assert {200, _res} = mutation(ctx.conn, :move_task, %{
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

    {:ok, space} = Operately.Groups.update_group(space, %{task_statuses: statuses})
    space
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
end
