defmodule OperatelyWeb.Api.Tasks.UpdateBoardStatusesTest do
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
        ctx = permission_context(ctx, @test) |> subscribe()
        before = snapshot(ctx)
        inputs = inputs(ctx) |> Map.update!(:task_statuses, &List.update_at(&1, 0, fn status -> %{status | label: "Backlog"} end))
        assert {code, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], inputs)
        assert code == @test.expected

        if code == 200 do
          assert hd(Repo.reload!(ctx.board).task_statuses).label == "Backlog"
          assert_project_broadcast(ctx)
        else
          assert_unchanged(ctx, before)
        end
      end
    end
  end

  test "requires authentication", ctx do
    ctx = setup_board(ctx, :project) |> subscribe()
    before = snapshot(ctx)
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :update_board_statuses], inputs(ctx))
    assert_unchanged(ctx, before)
  end

  test "requires valid board and status inputs", ctx do
    ctx = setup_board(ctx, :project) |> subscribe()
    before = snapshot(ctx)
    inputs = inputs(ctx)

    for invalid <- [Map.delete(inputs, :board_id), Map.delete(inputs, :task_statuses), %{inputs | task_statuses: nil}] do
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], invalid)
    end

    for id <- ["invalid-id", Ecto.UUID.generate()] do
      assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{inputs | board_id: id})
    end

    assert_unchanged(ctx, before)
  end

  for owner <- [:project, :space] do
    @owner owner

    test "rejects cross-company #{@owner} boards", ctx do
      ctx = setup_board(ctx, @owner) |> subscribe()
      foreign = setup_board(Factory.setup(%{}), @owner)
      before = snapshot(foreign)
      assert {404, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], inputs(foreign))
      assert_unchanged(foreign, before)
    end

    test "rejects #{@owner} board edits when the company is read-only", ctx do
      ctx = setup_board(ctx, @owner) |> subscribe()
      put_company_in_read_only(ctx.company)
      before = snapshot(ctx)
      assert {403, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], inputs(ctx))
      assert_unchanged(ctx, before)
    end

    test "rejects archived #{@owner} boards", ctx do
      ctx = setup_board(ctx, @owner) |> subscribe()
      Repo.update!(Ecto.Changeset.change(ctx.board, archived_at: ~N[2026-11-13 00:00:00]))
      before = snapshot(ctx)
      assert {400, %{details: %{code: "task_board_archived"}}} = mutation(ctx.conn, [:tasks, :update_board_statuses], inputs(ctx))
      assert_unchanged(ctx, before)
    end

    test "adds and reorders #{@owner} statuses without creating task activities", ctx do
      ctx = setup_board(ctx, @owner) |> subscribe()
      new_status = %{id: Ecto.UUID.generate(), label: "Review", color: "blue", index: 0, value: "review", closed: false}
      statuses = [new_status | Enum.reverse(inputs(ctx).task_statuses)] |> Enum.with_index(fn status, index -> %{status | index: index} end)
      activities = Repo.aggregate(Activity, :count)
      assert {200, %{success: true, board_id: id}} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{inputs(ctx) | task_statuses: statuses})
      assert id == Operately.ShortUuid.encode!(ctx.board.id)
      persisted = Enum.map(Repo.reload!(ctx.board).task_statuses, &Serializer.serialize/1)
      assert Enum.map(persisted, &Map.delete(&1, :__typename)) == Enum.map(statuses, &Map.delete(&1, :__typename))
      assert Repo.aggregate(Activity, :count) == activities
      assert_project_broadcast(ctx)
    end

    test "replaces occupied #{@owner} statuses, including archived tasks, only on the selected board", ctx do
      ctx = setup_board(ctx, @owner) |> add_task(:task) |> add_task(:archived_task) |> subscribe()
      Repo.update!(Ecto.Changeset.change(ctx.archived_task, archived_at: ~N[2026-11-13 00:00:00]))
      board = Repo.reload!(ctx.board)
      removed = ctx.task.task_status
      replacement = Enum.find(board.task_statuses, & &1.closed)
      ctx = add_task(ctx, :retained_task, task_status: Map.from_struct(replacement))
      other_board = Repo.insert!(TaskBoard.changeset(%{space_id: ctx.space.id, name: "Other", task_statuses: Enum.map(board.task_statuses, &Map.from_struct/1)}))
      ctx = Factory.create_space_task(ctx, :other_task, :space, board_id: other_board.id, task_status: Map.from_struct(removed))
      other_task = Repo.reload!(ctx.other_task)
      other_board = Repo.reload!(other_board)
      activities = Repo.aggregate(Activity, :count)
      statuses = inputs(ctx).task_statuses |> Enum.reject(&(&1.id == removed.id))
      replacements = [%{deleted_status_id: removed.id, replacement_status_id: replacement.id}]

      assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{board_id: board.id, task_statuses: statuses, deleted_status_replacements: replacements})

      for task <- [ctx.task, ctx.archived_task] do
        updated = Repo.reload!(task)
        assert updated.task_status.id == replacement.id
        assert updated.status == replacement.value
        assert updated.closed_at
        assert updated.milestone_id == task.milestone_id
        assert Paths.task_id(task) in Repo.reload!(board).tasks_kanban_state[replacement.value]
        refute Paths.task_id(task) in Repo.reload!(board).tasks_kanban_state[removed.value]
      end

      assert Repo.reload!(ctx.archived_task).archived_at == ~N[2026-11-13 00:00:00]
      assert Repo.reload!(ctx.retained_task).task_status.id == replacement.id
      assert Repo.reload!(ctx.other_task) == other_task
      assert Repo.reload!(other_board) == other_board
      assert Repo.aggregate(Activity, :count) == activities
      assert_project_broadcast(ctx)
    end
  end

  test "removes an unused status without replacements", ctx do
    ctx = setup_board(ctx, :space)
    [_removed | statuses] = inputs(ctx).task_statuses
    assert {200, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{inputs(ctx) | task_statuses: statuses})
    assert Enum.map(Repo.reload!(ctx.board).task_statuses, & &1.id) == Enum.map(statuses, & &1.id)
  end

  for archived <- [false, true] do
    @archived archived
    test "requires mappings for deleted statuses used by tasks (archived=#{@archived})", ctx do
      ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
      if @archived, do: Repo.update!(Ecto.Changeset.change(ctx.task, archived_at: ~N[2026-11-13 00:00:00]))
      statuses = Enum.reject(inputs(ctx).task_statuses, &(&1.id == ctx.task.task_status.id))
      before = snapshot(ctx)
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{board_id: ctx.board.id, task_statuses: statuses, deleted_status_replacements: []})
      assert_unchanged(ctx, before)
    end
  end

  test "rejects missing and deleted replacement targets atomically", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    [removed, also_removed | statuses] = inputs(ctx).task_statuses
    before = snapshot(ctx)

    for target <- [Ecto.UUID.generate(), also_removed.id] do
      replacements = [%{deleted_status_id: removed.id, replacement_status_id: target}, %{deleted_status_id: also_removed.id, replacement_status_id: hd(statuses).id}]
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{board_id: ctx.board.id, task_statuses: statuses, deleted_status_replacements: replacements})
      assert_unchanged(ctx, before)
    end
  end

  test "rejects empty and invalid workflows without changing tasks or publishing", ctx do
    ctx = setup_board(ctx, :project) |> add_task(:task) |> subscribe()
    before = snapshot(ctx)

    for statuses <- [[], List.update_at(inputs(ctx).task_statuses, 0, &%{&1 | label: ""})] do
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{inputs(ctx) | task_statuses: statuses})
      assert_unchanged(ctx, before)
    end
  end

  test "accepts a newly added replacement and preserves project milestone ordering", ctx do
    ctx = setup_board(ctx, :project) |> Factory.add_project_milestone(:milestone, :project) |> Factory.add_project_task(:task, :milestone) |> subscribe()
    milestone = Repo.reload!(ctx.milestone)
    replacement = %{id: Ecto.UUID.generate(), label: "Review", color: "blue", index: 0, value: "review", closed: false}
    replacements = [%{deleted_status_id: ctx.task.task_status.id, replacement_status_id: replacement.id}]
    assert {200, _} = mutation(ctx.conn, [:tasks, :update_board_statuses], %{board_id: ctx.board.id, task_statuses: [replacement], deleted_status_replacements: replacements})
    assert Repo.reload!(ctx.task).task_status.id == replacement.id
    assert Repo.reload!(ctx.task).milestone_id == milestone.id
    assert Repo.reload!(milestone).tasks_ordering_state == milestone.tasks_ordering_state
    assert Repo.reload!(milestone).tasks_kanban_state == milestone.tasks_kanban_state
    assert_project_broadcast(ctx)
  end

  defp inputs(ctx), do: %{board_id: ctx.board.id, task_statuses: Enum.map(ctx.board.task_statuses, &Serializer.serialize/1)}

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
