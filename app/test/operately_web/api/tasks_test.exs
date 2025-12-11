defmodule OperatelyWeb.Api.ProjectTasksTest do
  alias Operately.Support.RichText
  alias Operately.Projects.Contributor

  use OperatelyWeb.TurboCase
  use Operately.Support.Notifications

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_space_member(:new_champion, :engineering)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
  end

  describe "list tasks" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:tasks, :list], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:tasks, :list], %{})
      assert res.message == "Missing required fields: project_id"
    end

    test "it returns not found for non-existent project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:tasks, :list], %{
        project_id: Ecto.UUID.generate()
      })
    end

    test "it returns not found for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {404, _} = query(ctx.conn, [:tasks, :list], %{
        project_id: Paths.project_id(ctx.project)
      })
    end

    test "it returns tasks for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:tasks, :list], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.tasks) == 1
      assert hd(res.tasks).id == Paths.task_id(ctx.task)
      assert hd(res.tasks).name == ctx.task.name
    end

    test "it returns tasks for space members with view access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:space_member)

      assert {200, res} = query(ctx.conn, [:tasks, :list], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.tasks) == 1
      assert hd(res.tasks).id == Paths.task_id(ctx.task)
    end

    test "it returns empty list when project has no tasks", ctx do
      ctx =
        ctx
        |> Factory.add_project(:empty_project, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:tasks, :list], %{
        project_id: Paths.project_id(ctx.empty_project)
      })

      assert res.tasks == []
    end

    test "it returns multiple tasks when project has multiple tasks", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.add_project_task(:task3, :milestone)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:tasks, :list], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.tasks) == 3
      task_ids = Enum.map(res.tasks, & &1.id)
      assert Paths.task_id(ctx.task) in task_ids
      assert Paths.task_id(ctx.task2) in task_ids
      assert Paths.task_id(ctx.task3) in task_ids
    end

    test "it includes comments_count for tasks", ctx do
      ctx =
        ctx
        |> Factory.preload(:task, :project)
        |> Factory.add_comment(:comment1, :task)
        |> Factory.add_comment(:comment2, :task)
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:tasks, :list], %{
        project_id: Paths.project_id(ctx.project)
      })

      task_with_comments = Enum.find(res.tasks, &(&1.id == Paths.task_id(ctx.task)))
      task_without_comments = Enum.find(res.tasks, &(&1.id == Paths.task_id(ctx.task2)))

      assert task_with_comments.comments_count == 2
      assert task_without_comments.comments_count == 0
    end
  end

  describe "create task" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :create], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :create], %{name: "New Task", milestone_id: nil, assignee_id: nil, due_date: nil})
      assert res.message == "Missing required fields: project_id"
    end

    test "it requires a name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :create], %{project_id: Paths.project_id(ctx.project), milestone_id: Paths.milestone_id(ctx.milestone), assignee_id: nil, due_date: nil})
      assert res.message == "Missing required fields: name"
    end

    test "it creates a task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Implement feature X",
        assignee_id: nil,
        due_date: nil
      })

      assert res.task.name == "Implement feature X"

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.task.id)
      task = Operately.Tasks.Task.get!(:system, id: id)

      assert task.name == "Implement feature X"
      assert task.milestone_id == ctx.milestone.id
      assert task.creator_id == ctx.creator.id
    end

    test "it sets default task_status when creating a task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with default status",
        assignee_id: nil,
        due_date: nil
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.task.id)
      task = Operately.Tasks.Task.get!(:system, id: id)
      default_status = Operately.Tasks.Status.default_task_status()

      assert task.task_status.value == default_status.value
      assert task.task_status.label == default_status.label
      assert task.task_status.color == default_status.color
      assert task.task_status.index == default_status.index
      assert task.task_status.closed == default_status.closed
      assert task.task_status.id
    end

    test "it creates a task with assignee", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with assignee",
        assignee_id: Paths.person_id(ctx.creator),
        due_date: nil
      })
      assert res.task.name == "Task with assignee"

      # Verify assignee was created
      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.task.id)
      task = Operately.Tasks.Task.get!(:system, id: id, opts: [preload: [:assigned_people]])
      assert length(task.assigned_people) == 1
      assert hd(task.assigned_people).id == ctx.creator.id
    end

    test "it adds a contributor when creating a task with a new assignee", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:creator)

      refute Operately.Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.space_member.id)

      assert {200, _} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with assignee",
        assignee_id: Paths.person_id(ctx.space_member),
        due_date: nil
      })

      contributor = Operately.Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.space_member.id)

      assert contributor
      assert contributor.responsibility == "contributor"
      assert contributor.role == :contributor
    end

    test "it creates a subscription for the new contributor when assigning a task", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:creator)

      # Verify the space member is not a contributor yet
      refute Operately.Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.space_member.id)

      # Verify no subscription exists
      project = Operately.Repo.preload(ctx.project, :subscription_list)
      assert {:error, :not_found} = Operately.Notifications.Subscription.get(:system, subscription_list_id: project.subscription_list_id, person_id: ctx.space_member.id)

      assert {200, _} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with assignee",
        assignee_id: Paths.person_id(ctx.space_member),
        due_date: nil
      })

      # Verify subscription was created
      assert {:ok, subscription} = Operately.Notifications.Subscription.get(:system, subscription_list_id: project.subscription_list_id, person_id: ctx.space_member.id)
      assert subscription.type == :invited
      assert subscription.canceled == false
    end

    test "it creates a task with due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      due_date = %{
        date: "2026-06-01",
        date_type: "day",
        value: "Jun 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with due date",
        assignee_id: nil,
        due_date: due_date
      })
      assert res.task.name == "Task with due date"
      assert res.task.due_date == due_date
    end

    test "it creates an activity", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "task_adding")

      assert {200, _} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Activity test task",
        assignee_id: nil,
        due_date: nil
      })

      after_count = count_activities(ctx.project.id, "task_adding")
      assert after_count == before_count + 1
    end

    test "it returns forbidden for non-project members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Forbidden task",
        assignee_id: nil,
        due_date: nil
      })
    end

    test "it returns not found for non-existent project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Ecto.UUID.generate(),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task for missing milestone",
        assignee_id: nil,
        due_date: nil
      })
    end

    test "it creates task without milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: nil,
        name: "Task without milestone",
        assignee_id: nil,
        due_date: nil
      })

      assert res.task.name == "Task without milestone"

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.task.id)
      task = Operately.Tasks.Task.get!(:system, id: id)

      assert task.name == "Task without milestone"
      assert task.project_id == ctx.project.id
      assert task.milestone_id == nil
      assert task.creator_id == ctx.creator.id
    end

    test "it doesn't create task if milestone doesn't belong to project", ctx do
      ctx =
        ctx
        |> Factory.log_in_person(:creator)
        |> Factory.add_project(:project2, :engineering)

      assert {400, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project2),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task without milestone",
        assignee_id: nil,
        due_date: nil
      })

      assert res.message == "Milestone must belong to the same project as the task"
    end

    test "it adds the task ID to the milestone ordering state and returns the updated milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Get the milestone's ordering state before task creation
      milestone_before = Operately.Projects.get_milestone!(ctx.milestone.id)
      ordering_state_before = milestone_before.tasks_ordering_state

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task for ordering test",
        assignee_id: nil,
        due_date: nil
      })

      # Verify the task was created
      assert res.task.name == "Task for ordering test"

      # Verify the milestone was returned in the response
      assert res.updated_milestone.id == Paths.milestone_id(ctx.milestone)
      assert res.updated_milestone.tasks_ordering_state == [res.task.id]

      # Verify the milestone's ordering state contains the new task ID
      milestone_after = Operately.Projects.get_milestone!(ctx.milestone.id)
      ordering_state_after = milestone_after.tasks_ordering_state

      assert ordering_state_after == ordering_state_before ++ [res.task.id]
    end

    test "it appends the task to the milestone kanban state using the project's default status when none is provided", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      kanban_state = %{
        "pending" => [Paths.task_id(ctx.task)],
        "in_progress" => [],
        "done" => [],
        "canceled" => []
      }

      {:ok, _} = Operately.Projects.update_milestone(ctx.milestone, %{tasks_kanban_state: kanban_state})

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task for kanban test",
        assignee_id: nil,
        due_date: nil
      })

      pending_column = kanban_state["pending"] ++ [res.task.id]
      milestone_after = Operately.Projects.get_milestone!(ctx.milestone.id)

      assert milestone_after.tasks_kanban_state["pending"] == pending_column
      assert res.updated_milestone.tasks_kanban_state[:pending] == pending_column
    end

    test "it appends the task to the specified status column in the milestone kanban state", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status_struct =
        Enum.find(ctx.project.task_statuses, &(&1.value == "in_progress")) ||
          List.first(ctx.project.task_statuses)

      status = Map.from_struct(status_struct) |> Map.put(:color, Atom.to_string(status_struct.color))

      kanban_state = %{
        "pending" => [],
        "in_progress" => [Paths.task_id(ctx.task)],
        "done" => [],
        "canceled" => []
      }

      {:ok, _} = Operately.Projects.update_milestone(ctx.milestone, %{tasks_kanban_state: kanban_state})

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task for kanban status test",
        assignee_id: nil,
        due_date: nil,
        status: status
      })

      in_progress_column = kanban_state["in_progress"] ++ [res.task.id]
      milestone_after = Operately.Projects.get_milestone!(ctx.milestone.id)

      assert milestone_after.tasks_kanban_state["in_progress"] == in_progress_column
      assert res.updated_milestone.tasks_kanban_state[:in_progress] == in_progress_column
    end

    test "it validates status when provided", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Pick a status from the project
      status_struct = List.first(ctx.project.task_statuses)
      status = Map.from_struct(status_struct) |> Map.put(:color, Atom.to_string(status_struct.color))

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with status",
        assignee_id: nil,
        due_date: nil,
        status: status
      })

      assert res.task.status.id == status.id
    end

    test "it rejects invalid status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      invalid_status = %{
        id: "invalid",
        label: "Invalid",
        color: "red",
        index: 99,
        value: "invalid",
        closed: false
      }

      assert {400, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task with invalid status",
        assignee_id: nil,
        due_date: nil,
        status: invalid_status
      })

      assert res.message == "Invalid status"
    end

    test "it selects default status with priority: gray -> blue -> any", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      gray = %{id: "gray", label: "Gray", color: "gray", index: 0, value: "gray_status", closed: false}
      blue = %{id: "blue", label: "Blue", color: "blue", index: 1, value: "blue_status", closed: false}
      green = %{id: "green", label: "Green", color: "green", index: 2, value: "green_status", closed: false}

      # Case 1: Gray exists
      {:ok, project} = Operately.Projects.update_project(ctx.project, %{task_statuses: [green, blue, gray]})

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task 1",
        assignee_id: nil,
        due_date: nil,
      })
      assert res.task.status.value == "gray_status"

      # Case 2: No Gray, but Blue exists
      {:ok, project} = Operately.Projects.update_project(project, %{task_statuses: [green, blue]})

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task 2",
        assignee_id: nil,
        due_date: nil,
      })
      assert res.task.status.value == "blue_status"

      # Case 3: Neither Gray nor Blue
      {:ok, project} = Operately.Projects.update_project(project, %{task_statuses: [green]})

      assert {200, res} = mutation(ctx.conn, [:tasks, :create], %{
        project_id: Paths.project_id(project),
        milestone_id: Paths.milestone_id(ctx.milestone),
        name: "Task 3",
        assignee_id: nil,
        due_date: nil,
      })
      assert res.task.status.value == "green_status"
    end
  end

  describe "update task status" do
    @done_status %{
      id: "done",
      label: "Done",
      color: "green",
      index: 0,
      value: "done",
      closed: true
    }

    @canceled_status %{
      id: "canceled",
      label: "Canceled",
      color: "green",
      index: 1,
      value: "canceled",
      closed: true
    }

    @in_progress_status %{
      id: "in_progress",
      label: "In progress",
      color: "green",
      index: 2,
      value: "in_progress",
      closed: false
    }

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_status], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} =
               mutation(ctx.conn, [:tasks, :update_status], %{status: @done_status, type: "project"})

      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_status], %{task_id: Paths.task_id(ctx.task), type: "project"})
      assert res.message == "Missing required fields: status"
    end

    test "it requires a type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.task),
        status: @done_status
      })

      assert res.message == "Missing required fields: type"
    end

    test "it updates a task status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.task),
        status: @done_status,
        type: "project"
      })

      assert res.task.status.value == "done"
      assert res.task.status.closed == true

      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.status == "done"
    end

    test "it creates an activity when status is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "task_status_updating")

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.task),
        status: @done_status,
        type: "project"
      })

      after_count = count_activities(ctx.project.id, "task_status_updating")
      assert after_count == before_count + 1
    end

    test "it removes task from milestone ordering state when status changes to done", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Ensure task is in milestone's ordering state initially
      ordering_state = Operately.Tasks.OrderingState.add_task(ctx.milestone.tasks_ordering_state, ctx.task)
      {:ok, milestone} = Operately.Projects.update_milestone(ctx.milestone, %{tasks_ordering_state: ordering_state})

      assert Paths.task_id(ctx.task) in milestone.tasks_ordering_state

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.task),
        status: @done_status,
        type: "project"
      })

      # Check that task is now in the milestone's ordering state
      milestone_after = Repo.reload(ctx.milestone)
      refute Paths.task_id(ctx.task) in milestone_after.tasks_ordering_state
      refute Paths.task_id(ctx.task) in res.updated_milestone.tasks_ordering_state
    end

    test "it removes task from milestone ordering state when status changes to canceled", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Ensure task is in milestone's ordering state initially
      ordering_state = Operately.Tasks.OrderingState.add_task(ctx.milestone.tasks_ordering_state, ctx.task)
      {:ok, milestone} = Operately.Projects.update_milestone(ctx.milestone, %{tasks_ordering_state: ordering_state})

      assert Paths.task_id(ctx.task) in milestone.tasks_ordering_state

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.task),
        status: @canceled_status,
        type: "project"
      })

      # Check that task is now in the milestone's ordering state
      milestone_after = Repo.reload(ctx.milestone)
      refute Paths.task_id(ctx.task) in milestone_after.tasks_ordering_state
      refute Paths.task_id(ctx.task) in res.updated_milestone.tasks_ordering_state
    end

    test "it adds task from milestone ordering state when status changes from done to in_progress", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      {:ok, _} = Operately.Tasks.update_task(ctx.task, %{status: "done"})

      # Verify task is not in milestone's ordering state
      milestone = Repo.reload(ctx.milestone)
      refute Paths.task_id(ctx.task) in milestone.tasks_ordering_state

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.task),
        status: @in_progress_status,
        type: "project"
      })

      # Check that task is added from the milestone's ordering state
      milestone = Repo.reload(ctx.milestone)
      assert Paths.task_id(ctx.task) in milestone.tasks_ordering_state
      assert Paths.task_id(ctx.task) in res.updated_milestone.tasks_ordering_state
    end

    test "it updates a space task status", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_status], %{
        task_id: Paths.task_id(ctx.space_task),
        status: @done_status,
        type: "space"
      })

      assert res.task.status.value == "done"
      assert res.task.status.closed == true

      updated_task = Operately.Repo.reload(ctx.space_task)
      assert updated_task.status == "done"
    end
  end

  describe "update task kanban" do
    @in_progress_status %{
      id: "in_progress",
      label: "In progress",
      color: "blue",
      index: 1,
      value: "in_progress",
      closed: false
    }

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_kanban], %{})
    end

    test "it updates status and kanban state for a milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: []
      }

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_kanban], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone),
        status: @in_progress_status,
        milestone_kanban_state: Jason.encode!(kanban_state)
      })

      assert res.task.status.value == "in_progress"

      milestone = Repo.reload(ctx.milestone)
      assert milestone.tasks_kanban_state["in_progress"] == kanban_state.in_progress
    end

    test "it rejects mismatched milestone ids", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:other_milestone, :project)
        |> Factory.log_in_person(:creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_kanban], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.other_milestone),
        status: @in_progress_status,
        milestone_kanban_state: Jason.encode!(%{pending: [], in_progress: [], done: [], canceled: []})
      })

      assert res.message == "Task milestone mismatch"
    end

    test "it rejects invalid statuses in kanban state", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      invalid_kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: [],
        blocked: [Paths.task_id(ctx.task)]
      }

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_kanban], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone),
        status: @in_progress_status,
        milestone_kanban_state: Jason.encode!(invalid_kanban_state)
      })

      assert res.message == "Invalid status blocked"
    end
  end

  describe "update task due date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_due_date], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        due_date: %{date: "2026-01-01", date_type: "day"},
        type: "project"
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        task_id: Paths.task_id(ctx.task),
        due_date: %{date: "2026-01-01", date_type: "day"}
      })
      assert res.message == "Missing required fields: type"
    end

    test "it updates a task due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      due_date = %{
        date: "2026-06-01",
        date_type: "day",
        value: "Jun 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        task_id: Paths.task_id(ctx.task),
        due_date: due_date,
        type: "project"
      })

      assert res.task.due_date == due_date

      updated_task = Operately.Repo.reload(ctx.task)
      # Convert struct to map for comparison
      normalized_due_date = %{
        "date" => updated_task.due_date.date |> Date.to_iso8601(),
        "date_type" => updated_task.due_date.date_type |> Atom.to_string(),
        "value" => updated_task.due_date.value
      }
      assert normalized_due_date == %{
        "date" => due_date.date,
        "date_type" => due_date.date_type,
        "value" => due_date.value
      }
    end

    test "it can remove a due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First set a due date
      due_date = %{
        date: "2026-06-01",
        date_type: "day",
        value: "Jun 1, 2026"
      }

      {:ok, task} = Operately.Tasks.update_task(ctx.task, %{due_date: due_date})
      # Convert struct to map for comparison
      normalized_due_date = %{
        "date" => task.due_date.date |> Date.to_iso8601(),
        "date_type" => task.due_date.date_type |> Atom.to_string(),
        "value" => task.due_date.value
      }
      assert normalized_due_date == %{
        "date" => due_date.date,
        "date_type" => due_date.date_type,
        "value" => due_date.value
      }

      # Then remove it
      assert {200, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        task_id: Paths.task_id(ctx.task),
        due_date: nil,
        type: "project"
      })

      assert res.task.due_date == nil

      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.due_date == nil
    end

    test "it creates an activity when due date is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "task_due_date_updating")

      due_date = %{
        date: "2026-06-01",
        date_type: "day",
        value: "Jun 1, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        task_id: Paths.task_id(ctx.task),
        due_date: due_date,
        type: "project"
      })

      after_count = count_activities(ctx.project.id, "task_due_date_updating")
      assert after_count == before_count + 1
    end

    test "it notifies assignee", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_task_assignee(ctx, :assignee, :task, :new_champion)
      action = "task_due_date_updating"

      assert notifications_count(action: action) == 0

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        task_id: Paths.task_id(ctx.task),
        due_date: %{ date: "2026-06-01", date_type: "day", value: "Jun 1, 2026" },
        type: "project"
      })

      assert notifications_count(action: action) == 1

      activity = get_activity(task: ctx.task, action: action)
      notification = fetch_notification(activity.id)

      assert notification.person_id == ctx.new_champion.id
    end

    test "it updates a space task due date", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :engineering)
        |> Factory.log_in_person(:creator)

      due_date = %{
        date: "2026-06-01",
        date_type: "day",
        value: "Jun 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
        task_id: Paths.task_id(ctx.space_task),
        due_date: due_date,
        type: "space"
      })

      assert res.task.due_date == due_date

      updated_task = Operately.Repo.reload(ctx.space_task)
      # Convert struct to map for comparison
      normalized_due_date = %{
        "date" => updated_task.due_date.date |> Date.to_iso8601(),
        "date_type" => updated_task.due_date.date_type |> Atom.to_string(),
        "value" => updated_task.due_date.value
      }
      assert normalized_due_date == %{
        "date" => due_date.date,
        "date_type" => due_date.date_type,
        "value" => due_date.value
      }
    end
  end

  describe "update task assignee" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_assignee], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        assignee_id: Paths.person_id(ctx.creator),
        type: "project"
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.task),
        assignee_id: Paths.person_id(ctx.creator)
      })
      assert res.message == "Missing required fields: type"
    end

    test "it assigns a person to a task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.task),
        assignee_id: Paths.person_id(ctx.creator),
        type: "project"
      })

      # Verify response
      assert length(res.task.assignees) == 1
      assert hd(res.task.assignees).id == Paths.person_id(ctx.creator)

      # Verify database update
      updated_task = Operately.Repo.reload(ctx.task)
      updated_task = Operately.Repo.preload(updated_task, :assigned_people)
      assert length(updated_task.assigned_people) == 1
      assert hd(updated_task.assigned_people).id == ctx.creator.id
    end

    test "it can remove an assignee", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First assign someone
      {:ok, _} = Operately.Tasks.Assignee.changeset(%{
        task_id: ctx.task.id,
        person_id: ctx.creator.id
      }) |> Operately.Repo.insert()

      # Verify assignment
      task = Operately.Repo.reload(ctx.task)
      task = Operately.Repo.preload(task, :assigned_people)
      assert length(task.assigned_people) == 1

      # Then remove assignee
      assert {200, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.task),
        assignee_id: nil,
        type: "project"
      })

      # Verify response
      assert res.task.assignees == []

      # Verify database update
      updated_task = Operately.Repo.reload(ctx.task)
      updated_task = Operately.Repo.preload(updated_task, :assigned_people)
      assert updated_task.assigned_people == []
    end

    test "it creates an activity when assignee is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "task_assignee_updating")

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.task),
        assignee_id: Paths.person_id(ctx.creator),
        type: "project"
      })

      after_count = count_activities(ctx.project.id, "task_assignee_updating")
      assert after_count == before_count + 1
    end

    test "it adds a contributor when assigning a space member", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:creator)

      refute Operately.Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.space_member.id)

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.task),
        assignee_id: Paths.person_id(ctx.space_member),
        type: "project"
      })

      contributor = Operately.Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.space_member.id)

      assert contributor
      assert contributor.responsibility == "contributor"
      assert contributor.role == :contributor
    end

    test "it creates a subscription for the new contributor when updating assignee", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:creator)

      # Verify the space member is not a contributor yet
      refute Operately.Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.space_member.id)

      # Verify no subscription exists
      project = Operately.Repo.preload(ctx.project, :subscription_list)
      assert {:error, :not_found} = Operately.Notifications.Subscription.get(:system, subscription_list_id: project.subscription_list_id, person_id: ctx.space_member.id)

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.task),
        assignee_id: Paths.person_id(ctx.space_member),
        type: "project"
      })

      # Verify subscription was created
      assert {:ok, subscription} = Operately.Notifications.Subscription.get(:system, subscription_list_id: project.subscription_list_id, person_id: ctx.space_member.id)
      assert subscription.type == :invited
      assert subscription.canceled == false
    end

    test "it assigns a person to a space task", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
        task_id: Paths.task_id(ctx.space_task),
        assignee_id: Paths.person_id(ctx.creator),
        type: "space"
      })

      # Verify response
      assert length(res.task.assignees) == 1
      assert hd(res.task.assignees).id == Paths.person_id(ctx.creator)

      # Verify database update
      updated_task = Operately.Repo.reload(ctx.space_task)
      updated_task = Operately.Repo.preload(updated_task, :assigned_people)
      assert length(updated_task.assigned_people) == 1
      assert hd(updated_task.assigned_people).id == ctx.creator.id
    end
  end

  describe "update task milestone" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        milestones_ordering_state: []
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it updates a task milestone and ordering states", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.log_in_person(:creator)

      # Moving task from milestone to milestone2, updating ordering for both
      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2),
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task2)]  # Only task2 remains
          },
          %{
            milestone_id: Paths.milestone_id(ctx.milestone2),
            ordering_state: [Paths.task_id(ctx.task)]  # task moved here
          }
        ]
      })

      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.milestone_id == ctx.milestone2.id

      # Verify ordering states were updated
      updated_milestone = Operately.Repo.reload(ctx.milestone)
      updated_milestone2 = Operately.Repo.reload(ctx.milestone2)

      assert updated_milestone.tasks_ordering_state == [Paths.task_id(ctx.task2)]
      assert updated_milestone2.tasks_ordering_state == [Paths.task_id(ctx.task)]
    end

    test "it can remove a milestone", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.log_in_person(:creator)

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: nil,
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task2)]  # Only task2 remains
          }
        ]
      })

      updated_task = Operately.Repo.reload(ctx.task)
      refute updated_task.milestone_id

      # Verify ordering state was updated to remove the task
      updated_milestone = Operately.Repo.reload(ctx.milestone)
      assert updated_milestone.tasks_ordering_state == [Paths.task_id(ctx.task2)]
    end

    test "it creates an activity when milestone is updated", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.log_in_person(:creator)

      before_count = count_activities(ctx.project.id, "task_milestone_updating")

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2),
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: []
          },
          %{
            milestone_id: Paths.milestone_id(ctx.milestone2),
            ordering_state: [Paths.task_id(ctx.task)]
          }
        ]
      })

      after_count = count_activities(ctx.project.id, "task_milestone_updating")
      assert after_count == before_count + 1
    end

    test "it does not create an activity when milestone stays the same", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.log_in_person(:creator)

      before_count = count_activities(ctx.project.id, "task_milestone_updating")

      # Task stays in same milestone, only ordering changes
      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone),  # Same milestone
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task)]
          }
        ]
      })

      after_count = count_activities(ctx.project.id, "task_milestone_updating")
      assert after_count == before_count  # No new activity created
    end

    test "it can't update to a milestone from a different project", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project2, :engineering)
        |> Factory.add_project_milestone(:milestone2, :project2)
        |> Factory.log_in_person(:creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2),
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone2),
            ordering_state: [Paths.task_id(ctx.task)]
          }
        ]
      })

      assert res.message == "Milestone must belong to the same project as the task"
    end

    test "it updates only ordering state when milestone doesn't change", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.add_project_task(:task3, :milestone)
        |> Factory.log_in_person(:creator)

      # Task stays in same milestone, but ordering changes
      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone),  # Same milestone
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task), Paths.task_id(ctx.task3)]  # task moved to middle
          }
        ]
      })

      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.milestone_id == ctx.milestone.id

      # Verify ordering state was updated
      updated_milestone = Operately.Repo.reload(ctx.milestone)
      assert updated_milestone.tasks_ordering_state == [Paths.task_id(ctx.task2), Paths.task_id(ctx.task), Paths.task_id(ctx.task3)]
    end

    test "it updates ordering states for both milestones when task changes milestone", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.add_project_task(:task3, :milestone)
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.add_project_task(:task4, :milestone2)
        |> Factory.log_in_person(:creator)

      # Task moves from milestone to milestone2, affecting both ordering states
      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2),
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task3)]  # task removed
          },
          %{
            milestone_id: Paths.milestone_id(ctx.milestone2),
            ordering_state: [Paths.task_id(ctx.task), Paths.task_id(ctx.task4)]  # task added at beginning
          }
        ]
      })

      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.milestone_id == ctx.milestone2.id

      # Verify both milestone ordering states were updated
      updated_milestone = Operately.Repo.reload(ctx.milestone)
      updated_milestone2 = Operately.Repo.reload(ctx.milestone2)

      assert updated_milestone.tasks_ordering_state == [Paths.task_id(ctx.task2), Paths.task_id(ctx.task3)]
      assert updated_milestone2.tasks_ordering_state == [Paths.task_id(ctx.task), Paths.task_id(ctx.task4)]
    end

    test "it filters out completed and canceled tasks from ordering state", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.add_project_task(:task3, :milestone, status: "done")
        |> Factory.add_project_task(:task4, :milestone, status: "canceled")
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.log_in_person(:creator)

      # Move task to another milestone and include all tasks in the ordering state
      assert {200, res} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2),
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task3), Paths.task_id(ctx.task4)]
          },
          %{
            milestone_id: Paths.milestone_id(ctx.milestone2),
            ordering_state: [Paths.task_id(ctx.task)]
          }
        ]
      })

      # Verify returned updated_milestones in the API response
      assert length(res.updated_milestones) == 2

      milestone1_response = Enum.find(res.updated_milestones, fn m -> m.id == Paths.milestone_id(ctx.milestone) end)
      milestone2_response = Enum.find(res.updated_milestones, fn m -> m.id == Paths.milestone_id(ctx.milestone2) end)

      # Check that response milestones have the filtered ordering states
      assert milestone1_response.tasks_ordering_state == [Paths.task_id(ctx.task2)]
      assert milestone2_response.tasks_ordering_state == [Paths.task_id(ctx.task)]

      # Verify database state
      updated_milestone = Operately.Repo.reload(ctx.milestone)
      updated_milestone2 = Operately.Repo.reload(ctx.milestone2)

      assert updated_milestone.tasks_ordering_state == [Paths.task_id(ctx.task2)]
      assert updated_milestone2.tasks_ordering_state == [Paths.task_id(ctx.task)]
    end

    test "it filters out tasks that belong to another milestone", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.add_project_task(:task3, :milestone2)
        |> Factory.log_in_person(:creator)

      # Try to include a task from milestone2 in milestone's ordering state
      assert {200, res} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone),  # Same milestone
        milestones_ordering_state: [
          %{
            milestone_id: Paths.milestone_id(ctx.milestone),
            ordering_state: [Paths.task_id(ctx.task), Paths.task_id(ctx.task2), Paths.task_id(ctx.task3)]
          }
        ]
      })

      # Verify the updated_milestones in the API response
      assert length(res.updated_milestones) == 1
      milestone_response = hd(res.updated_milestones)
      assert milestone_response.id == Paths.milestone_id(ctx.milestone)

      # Verify the task from the other milestone was filtered out in the response
      assert milestone_response.tasks_ordering_state == [Paths.task_id(ctx.task), Paths.task_id(ctx.task2)]

      # Verify database state
      updated_milestone = Operately.Repo.reload(ctx.milestone)
      assert updated_milestone.tasks_ordering_state == [Paths.task_id(ctx.task), Paths.task_id(ctx.task2)]
    end
  end

  describe "update milestone" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_milestone], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_milestone], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it updates a task milestone", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.log_in_person(:creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_milestone], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2)
      })

      # Verify response
      assert res.task.milestone.id == Paths.milestone_id(ctx.milestone2)

      # Verify database update
      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.milestone_id == ctx.milestone2.id
    end

    test "it can remove a milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_milestone], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: nil
      })

      # Verify response
      assert res.task.milestone == nil

      # Verify database update
      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.milestone_id == nil
    end

    test "it creates an activity when milestone is updated", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.log_in_person(:creator)

      before_count = count_activities(ctx.project.id, "task_milestone_updating")

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_milestone], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2)
      })

      after_count = count_activities(ctx.project.id, "task_milestone_updating")
      assert after_count == before_count + 1
    end

    test "it can't update to a milestone from a different project", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project2, :engineering)
        |> Factory.add_project_milestone(:milestone2, :project2)
        |> Factory.log_in_person(:creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_milestone], %{
        task_id: Paths.task_id(ctx.task),
        milestone_id: Paths.milestone_id(ctx.milestone2)
      })

      assert res.message == "Milestone must belong to the same project as the task"
    end
  end

  describe "update task description" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_description], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_description], %{
        description: RichText.rich_text("New task description", :as_string),
        type: "project"
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Paths.task_id(ctx.task),
        type: "project"
      })
      assert res.message == "Missing required fields: description"
    end

    test "it requires a type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Paths.task_id(ctx.task),
        description: RichText.rich_text("New description", :as_string)
      })
      assert res.message == "Missing required fields: type"
    end

    test "it updates a task description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      description = RichText.rich_text("Updated task description", :as_string)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Paths.task_id(ctx.task),
        description: description,
        type: "project"
      })

      # Check response
      assert res.task.description == description

      # Check database
      description_map = Jason.decode!(description)
      updated_task = Operately.Repo.reload(ctx.task)

      assert updated_task.description == description_map
    end

    test "it creates an activity when description is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities("task_description_change")
      description = RichText.rich_text("Another description update", :as_string)

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Paths.task_id(ctx.task),
        description: description,
        type: "project"
      })

      after_count = count_activities("task_description_change")
      assert after_count == before_count + 1
    end

    test "it returns not found for non-existent task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      description = RichText.rich_text("Description for non-existent task", :as_string)

      assert {404, _} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Ecto.UUID.generate(),
        description: description,
        type: "project"
      })
    end

    test "it returns forbidden for non-project members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      description = RichText.rich_text("Forbidden description update", :as_string)

      assert {403, _} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Paths.task_id(ctx.task),
        description: description,
        type: "project"
      })
    end

    test "it updates a space task description", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :engineering)
        |> Factory.log_in_person(:creator)

      description = RichText.rich_text("Updated space task description", :as_string)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_description], %{
        task_id: Paths.task_id(ctx.space_task),
        description: description,
        type: "space"
      })

      # Check response
      assert res.task.description == description

      # Check database
      description_map = Jason.decode!(description)
      updated_task = Operately.Repo.reload(ctx.space_task)

      assert updated_task.description == description_map
    end
  end

  describe "update task name" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_name], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_name], %{
        name: "Updated Task Name",
        type: "project"
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Paths.task_id(ctx.task),
        type: "project"
      })
      assert res.message == "Missing required fields: name"
    end

    test "it requires a type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Paths.task_id(ctx.task),
        name: "New Name"
      })
      assert res.message == "Missing required fields: type"
    end

    test "it updates a task name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Paths.task_id(ctx.task),
        name: "Updated Task Name",
        type: "project"
      })

      # Check response
      assert res.task.name == "Updated Task Name"

      # Check database
      updated_task = Operately.Repo.reload(ctx.task)
      assert updated_task.name == "Updated Task Name"
    end

    test "it creates an activity when name is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "task_name_updating")

      assert {200, _} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Paths.task_id(ctx.task),
        name: "Activity Test Name",
        type: "project"
      })

      after_count = count_activities(ctx.project.id, "task_name_updating")
      assert after_count == before_count + 1
    end

    test "it returns not found for non-existent task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Ecto.UUID.generate(),
        name: "Name for non-existent task",
        type: "project"
      })
    end

    test "it returns forbidden for non-project members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Paths.task_id(ctx.task),
        name: "Forbidden name update",
        type: "project"
      })
    end

    test "it updates a space task name", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, res} = mutation(ctx.conn, [:tasks, :update_name], %{
        task_id: Paths.task_id(ctx.space_task),
        name: "Updated Space Task Name",
        type: "space"
      })

      # Check response
      assert res.task.name == "Updated Space Task Name"

      # Check database
      updated_task = Operately.Repo.reload(ctx.space_task)
      assert updated_task.name == "Updated Space Task Name"
    end
  end

  describe "delete task" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :delete], %{})
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :delete], %{
        type: "project"
      })
      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: Paths.task_id(ctx.task)
      })
      assert res.message == "Missing required fields: type"
    end

    test "it deletes a task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Verify task exists
      task_id = Paths.task_id(ctx.task)
      {:ok, decoded_id} = OperatelyWeb.Api.Helpers.decode_id(task_id)
      assert Operately.Repo.get(Operately.Tasks.Task, decoded_id) != nil

      assert {200, res} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: task_id,
        type: "project"
      })

      assert res.success == true

      # Verify task no longer exists
      assert Operately.Repo.get(Operately.Tasks.Task, decoded_id) == nil
    end

    test "it returns not found for non-existent task", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: Ecto.UUID.generate(),
        type: "project"
      })
    end

    test "it returns forbidden for non-project members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: Paths.task_id(ctx.task),
        type: "project"
      })
    end

    test "it creates an activity when task is deleted", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "task_deleting")

      assert {200, _} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: Paths.task_id(ctx.task),
        type: "project"
      })

      after_count = count_activities(ctx.project.id, "task_deleting")
      assert after_count == before_count + 1
    end

    test "it removes the task from the milestone's ordering state", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      task_id = Paths.task_id(ctx.task)

      # Get the milestone and ensure the task is in its ordering state
      ordering_state = Operately.Tasks.OrderingState.load(ctx.milestone.tasks_ordering_state)
      updated_ordering = Operately.Tasks.OrderingState.add_task(ordering_state, ctx.task)

      {:ok, milestone} = Operately.Projects.Milestone.changeset(ctx.milestone, %{
        tasks_ordering_state: updated_ordering
      }) |> Operately.Repo.update()

      assert task_id in milestone.tasks_ordering_state

      assert {200, res} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: task_id,
        type: "project"
      })

      # Verify the task is deleted
      assert res.success == true

      # Verify the milestone was returned in the response
      assert res.updated_milestone.id == Paths.milestone_id(ctx.milestone)

      # Verify the task is no longer in the milestone's ordering state
      milestone_after = Repo.reload(ctx.milestone)
      refute task_id in milestone_after.tasks_ordering_state

      # Verify the response matches what's in the database
      assert res.updated_milestone.tasks_ordering_state == milestone_after.tasks_ordering_state
    end

    test "it deletes a space task", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :engineering)
        |> Factory.log_in_person(:creator)

      # Verify task exists
      task_id = Paths.task_id(ctx.space_task)
      {:ok, decoded_id} = OperatelyWeb.Api.Helpers.decode_id(task_id)
      assert Operately.Repo.get(Operately.Tasks.Task, decoded_id) != nil

      assert {200, res} = mutation(ctx.conn, [:tasks, :delete], %{
        task_id: task_id,
        type: "space"
      })

      assert res.success == true

      # Verify task no longer exists
      assert Operately.Repo.get(Operately.Tasks.Task, decoded_id) == nil
    end
  end

  #
  # Helpers
  #

  import Ecto.Query, only: [from: 2]

  defp count_activities(project_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project_id
    )
    |> Repo.aggregate(:count)
  end

  defp count_activities(action) do
    from(a in Operately.Activities.Activity, where: a.action == ^action)
    |> Repo.aggregate(:count)
  end

  defp get_activity(task: task, action: action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["task_id"] == ^task.id
    )
    |> Repo.one()
  end
end
