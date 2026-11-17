defmodule OperatelyWeb.Api.Wrappers.Projects.UpdateKanbanTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query, only: [from: 2]

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  describe "update tasks kanban state" do
    test "it updates project tasks_kanban_state and only creates activity when task status changes", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: []
      }

      before_count = count_task_activities(ctx.task, "task_status_updating")

      topic = "api:project_updated:#{ctx.project.id}"
      OperatelyWeb.Endpoint.subscribe(topic)

      assert {200, res1} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })

      assert Map.keys(res1) |> Enum.sort() == [:project, :task]
      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event"}
      refute_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event"}
      assert res1.project.id == Paths.project_id(ctx.project)
      assert res1.task.id == Paths.task_id(ctx.task)

      project = Repo.reload(ctx.project)
      assert Operately.Projects.Project.tasks_kanban_state(project)["in_progress"] == kanban_state.in_progress
      assert count_task_activities(ctx.task, "task_status_updating") == before_count + 1

      assert {200, _res2} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })

      assert count_task_activities(ctx.task, "task_status_updating") == before_count + 1
    end

    test "it doesn't create an activity when only the order changes", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task1, :milestone)
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state_1 = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task1), Paths.task_id(ctx.task2)],
        done: [],
        canceled: []
      }

      kanban_state_2 = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task1)],
        done: [],
        canceled: []
      }

      before_count = count_task_activities(ctx.task1, "task_status_updating")

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task1),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state_1)
               })

      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task1),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state_2)
               })

      project = Repo.reload(ctx.project)
      assert Operately.Projects.Project.tasks_kanban_state(project)["in_progress"] == kanban_state_2.in_progress
      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1
    end

    test "it doesn't work when the task doesn't belong to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project2, :engineering)
        |> Factory.add_project_milestone(:milestone2, :project2)
        |> Factory.add_project_task(:foreign_task, :milestone2)
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.foreign_task)],
        done: [],
        canceled: []
      }

      assert ctx.foreign_task.project_id != ctx.project.id

      assert {404, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.foreign_task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })
    end

    test "it requires authentication", ctx do
      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}
      assert {401, _} = mutation(ctx.conn, [:projects, :update_kanban], %{status: status, kanban_state: Jason.encode!(%{})})
    end

    test "it requires a project_id", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 task_id: Paths.task_id(ctx.task),
                 status: status_input,
                 kanban_state: Jason.encode!(%{})
               })

      assert res.message == "Missing required fields: project_id"
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 status: status_input,
                 kanban_state: Jason.encode!(%{})
               })

      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a status", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 kanban_state: Jason.encode!(%{})
               })

      assert res.message == "Missing required fields: status"
    end

    test "it requires a kanban_state", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 status: status_input
               })

      assert res.message == "Missing required fields: kanban_state"
    end

    test "it returns 404 when the person doesn't have read access to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}

      assert {404, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 status: status,
                 kanban_state: Jason.encode!(%{})
               })
    end

    test "it returns 404 when project_id is invalid", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}

      assert {404, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Ecto.UUID.generate(),
                 task_id: Paths.task_id(ctx.task),
                 status: status,
                 kanban_state: Jason.encode!(%{})
               })
    end

    test "it returns 404 when task_id is invalid", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}

      assert {404, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Ecto.UUID.generate(),
                 status: status,
                 kanban_state: Jason.encode!(%{})
               })
    end

    test "it returns 403 when the person doesn't have edit access to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:space_member)

      status_input =
        Enum.find(Operately.Projects.Project.task_statuses(ctx.project) || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      assert {403, _} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 status: status_input,
                 kanban_state: Jason.encode!(%{})
               })
    end

    test "it rejects a status that doesn't belong to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: []
      }

      invalid_status = %{
        id: Ecto.UUID.generate(),
        label: "Invalid",
        color: "blue",
        index: 99,
        value: "invalid",
        closed: false
      }

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_kanban], %{
                 project_id: Paths.project_id(ctx.project),
                 task_id: Paths.task_id(ctx.task),
                 status: invalid_status,
                 kanban_state: Jason.encode!(kanban_state)
               })

      assert res.message == "Invalid status"
    end
  end

  defp count_task_activities(task, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["task_id"] == ^task.id
    )
    |> Repo.aggregate(:count)
  end
end
