defmodule OperatelyWeb.Api.Tasks.UpdateBoardKanbanTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query, only: [from: 2]
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Tasks.{Task, TaskBoard}

  @permission_cases for {owner, source} <- [{:project, :company}, {:project, :space}, {:project, :project}, {:space, :company}, {:space, :space}],
                        {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}, {:full_access, 200}],
                        do: %{owner: owner, source: source, level: level, expected: expected}

  setup ctx do
    ctx |> Factory.setup() |> Factory.log_in_person(:creator)
  end

  describe "permissions" do
    tabletest @permission_cases do
      test "#{@test.owner} board with #{@test.source}=#{@test.level} returns #{@test.expected}", ctx do
        ctx = permission_context(ctx, @test) |> add_task(:task) |> subscribe()
        before = snapshot(ctx)
        assert {code, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], inputs(ctx))
        assert code == @test.expected

        if code == 200 do
          assert Repo.reload!(ctx.task).task_status.id == inputs(ctx).status.id
          assert_project_broadcast(ctx)
        else
          assert_unchanged(ctx, before)
        end
      end
    end
  end

  test "requires authentication", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    before = snapshot(ctx)
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :update_board_kanban], inputs(ctx))
    assert_unchanged(ctx, before)
  end

  test "requires valid identifiers, status, and JSON ordering", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    before = snapshot(ctx)

    for field <- [:board_id, :task_id, :status, :kanban_state] do
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], Map.delete(inputs(ctx), field))
    end

    assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs(ctx) | kanban_state: "{bad json"})
    assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs(ctx) | board_id: "invalid-id"})

    for field <- [:board_id, :task_id] do
      assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], Map.put(inputs(ctx), field, Ecto.UUID.generate()))
    end

    assert_unchanged(ctx, before)
  end

  for owner <- [:project, :space] do
    @owner owner

    test "hides cross-company #{@owner} boards and tasks", ctx do
      foreign = setup_board(Factory.setup(%{}), @owner) |> add_task(:task)
      before = snapshot(foreign)
      assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], inputs(foreign))
      assert_unchanged(foreign, before)
    end

    test "rejects #{@owner} board edits when the company is read-only", ctx do
      ctx = setup_board(ctx, @owner) |> add_task(:task) |> subscribe()
      put_company_in_read_only(ctx.company)
      before = snapshot(ctx)
      assert {403, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], inputs(ctx))
      assert_unchanged(ctx, before)
    end

    test "rejects archived #{@owner} boards", ctx do
      ctx = setup_board(ctx, @owner) |> add_task(:task) |> subscribe()
      Repo.update!(Ecto.Changeset.change(ctx.board, archived_at: ~N[2026-11-13 00:00:00]))
      before = snapshot(ctx)
      assert {400, %{details: %{code: "task_board_archived"}}} = mutation(ctx.conn, [:tasks, :update_board_kanban], inputs(ctx))
      assert_unchanged(ctx, before)
    end

    test "updates #{@owner} board ordering and creates exactly one status activity", ctx do
      ctx = setup_board(ctx, @owner) |> add_task(:task) |> subscribe()
      before = snapshot(ctx)
      assert {200, %{board_id: id, task: result}} = mutation(ctx.conn, [:tasks, :update_board_kanban], inputs(ctx))
      assert id == Operately.ShortUuid.encode!(ctx.board.id)
      assert result.id == Paths.task_id(ctx.task)
      assert result.status.id == inputs(ctx).status.id
      updated = Repo.reload!(ctx.task)
      assert updated.status == inputs(ctx).status.value
      assert updated.closed_at
      assert Repo.reload!(ctx.board).tasks_kanban_state[updated.task_status.value] == [Paths.task_id(ctx.task)]
      assert Repo.aggregate(Activity, :count) == before.activities + 1
      activity = Repo.one!(from a in Activity, where: a.action == "task_status_updating")
      assert activity.author_id == ctx.creator.id
      assert activity.content["task_id"] == ctx.task.id
      assert activity.content["project_id"] == ctx.board.project_id
      assert activity.content["space_id"] == ctx.space.id
      assert activity.content["old_status"]["id"] == ctx.task.task_status.id
      assert activity.content["new_status"]["id"] == updated.task_status.id
      assert_project_broadcast(ctx)
    end

    test "pure #{@owner} reordering does not create status activities", ctx do
      ctx = setup_board(ctx, @owner) |> add_task(:task) |> add_task(:second_task) |> subscribe()
      before = snapshot(ctx)
      status = Serializer.serialize(ctx.task.task_status)
      order = [Paths.task_id(ctx.second_task), Paths.task_id(ctx.task)]
      request = %{inputs(ctx) | status: status, kanban_state: Jason.encode!(%{status.value => order})}
      assert {200, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], request)
      assert Repo.reload!(ctx.board).tasks_kanban_state[status.value] == order
      assert Repo.reload!(ctx.task).task_status == ctx.task.task_status
      assert Repo.aggregate(Activity, :count) == before.activities
      assert_project_broadcast(ctx)
    end
  end

  test "preserves milestone membership and both milestone ordering fields", ctx do
    ctx =
      setup_board(ctx, :project)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    milestone = Repo.reload!(ctx.milestone)
    assert {200, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], inputs(ctx))
    assert Repo.reload!(ctx.task).milestone_id == milestone.id
    assert Repo.reload!(milestone).tasks_ordering_state == milestone.tasks_ordering_state
    assert Repo.reload!(milestone).tasks_kanban_state == milestone.tasks_kanban_state
  end

  test "uses canonical board status metadata", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task)
    inputs = inputs(ctx)
    stale_status = %{inputs.status | label: "Stale", color: "red", value: "stale", closed: false}
    assert {200, %{task: task}} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs | status: stale_status})
    assert Map.take(task.status, Map.keys(inputs.status)) == inputs.status
    assert Repo.reload!(ctx.task).closed_at
  end

  test "rejects a task from another board in the same space", ctx do
    ctx = setup_board(ctx, :space) |> add_task(:task) |> subscribe()
    board = Repo.insert!(TaskBoard.changeset(%{space_id: ctx.space.id, name: "Other", task_statuses: Enum.map(ctx.board.task_statuses, &Map.from_struct/1)}))
    ctx = Factory.create_space_task(ctx, :other_task, :space, board_id: board.id)
    before = snapshot(ctx)
    other_task = Repo.reload!(ctx.other_task)
    assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs(ctx) | task_id: ctx.other_task.id})
    assert Repo.reload!(ctx.other_task) == other_task
    assert_unchanged(ctx, before)
  end

  test "rejects a task from another project", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    ctx = Factory.add_project(ctx, :other_project, :space)
    ctx = Factory.add_project_task(ctx, :other_task, nil, project_id: ctx.other_project.id)
    before = snapshot(ctx)
    assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs(ctx) | task_id: ctx.other_task.id})
    assert_unchanged(ctx, before)
  end

  test "rejects a status from another board without writes or publication", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    other_board = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    before = snapshot(ctx)
    assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs(ctx) | status: Serializer.serialize(hd(other_board.task_statuses))})
    assert_unchanged(ctx, before)
  end

  test "rolls back task status and timestamps when ordering contains a foreign task", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> Factory.create_space_task(:foreign_task, :space) |> subscribe()
    before = snapshot(ctx)
    request = %{inputs(ctx) | kanban_state: Jason.encode!(%{inputs(ctx).status.value => [Paths.task_id(ctx.task), Paths.task_id(ctx.foreign_task)]})}
    assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], request)
    assert_unchanged(ctx, before)
  end

  test "rolls back when ordering contains unknown status keys or invalid task IDs", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    before = snapshot(ctx)

    for {state, code} <- [{%{"unknown" => [Paths.task_id(ctx.task)]}, 400}, {%{inputs(ctx).status.value => ["invalid-id"]}, 404}] do
      assert {^code, _} = mutation(ctx.conn, [:tasks, :update_board_kanban], %{inputs(ctx) | kanban_state: Jason.encode!(state)})
      assert_unchanged(ctx, before)
    end
  end

  defp inputs(ctx) do
    status = Enum.find(ctx.board.task_statuses, & &1.closed) |> Serializer.serialize()
    %{board_id: ctx.board.id, task_id: ctx.task.id, status: status, kanban_state: Jason.encode!(%{status.value => [Paths.task_id(ctx.task)]})}
  end

  defp setup_board(ctx, owner, permissions \\ []) do
    company = Keyword.get(permissions, :company, :no_access)
    space = Keyword.get(permissions, :space, :no_access)
    ctx = Factory.add_space(ctx, :space, company_permissions: if(owner == :space, do: Binding.from_atom(company), else: 0))

    case owner do
      :project ->
        ctx = Factory.add_project(ctx, :project, :space, company_access_level: Binding.from_atom(company), space_access_level: Binding.from_atom(space))
        Map.put(ctx, :board, Operately.Projects.Project.task_board(ctx.project))

      :space ->
        Map.put(ctx, :board, Repo.get!(TaskBoard, ctx.space.default_task_board_id))
    end
  end

  defp permission_context(ctx, row) do
    ctx = setup_board(ctx, row.owner, [{row.source, row.level}]) |> Factory.add_company_member(:reader)

    if row.source == :space do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.reader.id, access_level: Binding.from_atom(row.level)}])
    end

    if row.source == :project do
      {:ok, _} =
        Operately.Projects.create_contributor(ctx.creator, %{
          project_id: ctx.project.id,
          person_id: ctx.reader.id,
          permissions: Binding.from_atom(row.level),
          responsibility: "Testing"
        })
    end

    Factory.log_in_person(ctx, :reader)
  end

  defp add_task(ctx, key, attrs \\ []) do
    case ctx.board do
      %TaskBoard{project_id: id} when not is_nil(id) -> Factory.add_project_task(ctx, key, nil, Keyword.put(attrs, :project_id, id))
      %TaskBoard{} -> Factory.create_space_task(ctx, key, :space, Keyword.put(attrs, :board_id, ctx.board.id))
    end
  end

  defp subscribe(ctx) do
    if ctx.board.project_id, do: OperatelyWeb.Endpoint.subscribe("api:project_updated:#{ctx.board.project_id}")
    ctx
  end

  defp snapshot(ctx) do
    %{
      board: Repo.reload!(ctx.board),
      tasks: Repo.all(from t in Task, where: t.board_id == ^ctx.board.id, order_by: t.id),
      activities: Repo.aggregate(Activity, :count)
    }
  end

  defp assert_unchanged(ctx, before) do
    assert snapshot(ctx) == before
    refute_receive %Phoenix.Socket.Broadcast{event: "event"}
  end

  defp assert_project_broadcast(ctx) do
    if ctx.board.project_id do
      topic = "api:project_updated:#{ctx.board.project_id}"
      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event"}
    end

    refute_receive %Phoenix.Socket.Broadcast{event: "event"}
  end

  defp put_company_in_read_only(company) do
    {:ok, account} = Operately.Billing.get_or_create_billing_account(company)

    {:ok, _} =
      Operately.Billing.update_billing_account(account, %{
        access_state: :read_only,
        access_state_reason: :past_due,
        access_state_started_at: DateTime.utc_now()
      })
  end
end
