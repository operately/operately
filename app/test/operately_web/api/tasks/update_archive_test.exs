defmodule OperatelyWeb.Api.Tasks.UpdateArchiveTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Tasks.Task

  @project_permissions_table [
    %{company: :no_access, space: :no_access, project: :no_access, expected: 404},
    %{company: :no_access, space: :no_access, project: :view_access, expected: 403},
    %{company: :no_access, space: :no_access, project: :comment_access, expected: 403},
    %{company: :no_access, space: :no_access, project: :edit_access, expected: 200},
    %{company: :no_access, space: :no_access, project: :full_access, expected: 200},
    %{company: :no_access, space: :view_access, project: :no_access, expected: 403},
    %{company: :no_access, space: :comment_access, project: :no_access, expected: 403},
    %{company: :no_access, space: :edit_access, project: :no_access, expected: 200},
    %{company: :no_access, space: :full_access, project: :no_access, expected: 200},
    %{company: :view_access, space: :no_access, project: :no_access, expected: 403},
    %{company: :comment_access, space: :no_access, project: :no_access, expected: 403},
    %{company: :edit_access, space: :no_access, project: :no_access, expected: 200},
    %{company: :full_access, space: :no_access, project: :no_access, expected: 200}
  ]

  @space_permissions_table [
    %{company: :no_access, space: :no_access, expected: 404},
    %{company: :no_access, space: :view_access, expected: 403},
    %{company: :no_access, space: :comment_access, expected: 403},
    %{company: :no_access, space: :edit_access, expected: 200},
    %{company: :no_access, space: :full_access, expected: 200},
    %{company: :view_access, space: :no_access, expected: 403},
    %{company: :comment_access, space: :no_access, expected: 403},
    %{company: :edit_access, space: :no_access, expected: 200},
    %{company: :full_access, space: :no_access, expected: 200}
  ]

  @project_archive_permissions for row <- @project_permissions_table, archived <- [true, false], do: Map.put(row, :archived, archived)
  @space_archive_permissions for row <- @space_permissions_table, archived <- [true, false], do: Map.put(row, :archived, archived)
  @task_actions for type <- [:project, :space], archived <- [true, false], do: %{type: type, archived: archived}

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:tasks, :update_archive], %{})
    end

    tabletest @task_actions do
      test "does not expose another company's #{@test.type} task when archived=#{@test.archived}", ctx do
        ctx = ctx |> Factory.setup() |> create_task(@test.type) |> prepare_task(@test.archived)
        other = Factory.setup(%{})
        ctx = ctx |> Map.put(:outsider, other.creator) |> Factory.log_in_person(:outsider)

        assert {404, _} = request(ctx, @test.archived)
        assert_archive_unchanged(ctx.task)
      end
    end
  end

  describe "input validation" do
    setup ctx do
      ctx |> Factory.setup() |> create_task(:project) |> Factory.log_in_person(:creator)
    end

    test "requires a task ID", ctx do
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_archive], %{archived: true})
    end

    test "requires the archived flag", ctx do
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_archive], %{task_id: Paths.task_id(ctx.task)})
    end

    test "returns not found for a malformed task ID", ctx do
      assert {404, _} = mutation(ctx.conn, [:tasks, :update_archive], %{task_id: "invalid", archived: true})
    end

    test "returns not found for an unknown task", ctx do
      assert {404, _} = mutation(ctx.conn, [:tasks, :update_archive], %{task_id: Ecto.UUID.generate(), archived: true})
    end

    test "rejects a non-boolean archived flag", ctx do
      assert {400, _} = mutation(ctx.conn, [:tasks, :update_archive], %{task_id: Paths.task_id(ctx.task), archived: "invalid"})
    end

    test "rejects archiving an open task", ctx do
      assert {400, _} = request(ctx, true)
      assert_archive_unchanged(ctx.task)
    end
  end

  describe "permissions" do
    setup ctx do
      ctx |> Factory.setup() |> Factory.add_company_member(:person) |> Factory.log_in_person(:person)
    end

    tabletest @project_archive_permissions do
      test "project task company=#{@test.company} space=#{@test.space} project=#{@test.project} archived=#{@test.archived}", ctx do
        ctx =
          ctx
          |> Factory.add_space(:space, company_permissions: Binding.no_access())
          |> Factory.add_project(:project, :space,
            company_access_level: Binding.from_atom(@test.company),
            space_access_level: Binding.from_atom(@test.space)
          )
          |> add_space_access(@test.space)
          |> add_project_access(@test.project)

        ctx = ctx |> Factory.add_project_task(:task, nil, project_id: ctx.project.id) |> prepare_task(@test.archived)

        assert {code, _} = request(ctx, @test.archived)
        assert code == @test.expected
        assert_permission_result(ctx.task, code, @test.archived)
      end
    end

    tabletest @space_archive_permissions do
      test "space task company=#{@test.company} space=#{@test.space} archived=#{@test.archived}", ctx do
        ctx =
          ctx
          |> Factory.add_space(:space, company_permissions: Binding.from_atom(@test.company))
          |> add_space_access(@test.space)
          |> Factory.create_space_task(:task, :space)
          |> prepare_task(@test.archived)

        assert {code, _} = request(ctx, @test.archived)
        assert code == @test.expected
        assert_permission_result(ctx.task, code, @test.archived)
      end
    end

    tabletest @task_actions do
      test "rejects company read-only mode for #{@test.type} tasks when archived=#{@test.archived}", ctx do
        ctx = ctx |> create_task(@test.type) |> prepare_task(@test.archived) |> Factory.log_in_person(:creator)
        %{company_id: ctx.company.id, access_state: :read_only} |> Operately.Billing.CompanyBillingAccount.changeset() |> Repo.insert!()

        assert {403, _} = request(ctx, @test.archived)
        assert_archive_unchanged(ctx.task)
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx |> Factory.setup() |> Factory.log_in_person(:creator)
    end

    tabletest @task_actions do
      test "returns the updated #{@test.type} task when archived=#{@test.archived}", ctx do
        ctx = ctx |> create_task(@test.type) |> prepare_task(@test.archived)

        assert {200, %{task: task}} = request(ctx, @test.archived)
        assert task.id == Paths.task_id(ctx.task)
        assert task.name == ctx.task.name
        assert task.status.value == ctx.task.task_status.value

        persisted = Repo.reload!(ctx.task)
        assert not is_nil(persisted.archived_at) == @test.archived

        if @test.archived do
          assert task.archived_at == NaiveDateTime.to_iso8601(persisted.archived_at) <> "Z"
        else
          assert is_nil(task.archived_at)
        end
      end
    end
  end

  defp request(ctx, archived) do
    mutation(ctx.conn, [:tasks, :update_archive], %{task_id: Paths.task_id(ctx.task), archived: archived})
  end

  defp create_task(ctx, :project) do
    ctx = ctx |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    Factory.add_project_task(ctx, :task, nil, project_id: ctx.project.id)
  end

  defp create_task(ctx, :space) do
    ctx |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)
  end

  defp prepare_task(ctx, archived) do
    board = if ctx.task.project_id, do: ctx.project, else: ctx.space
    status = Enum.find(board.task_statuses, & &1.closed)
    archived_at = if archived, do: nil, else: ~N[2026-01-01 12:00:00]
    attrs = ctx.task |> Task.status_change_attrs(status) |> Map.put(:archived_at, archived_at)
    {:ok, task} = Operately.Tasks.update_task(ctx.task, attrs)
    Map.put(ctx, :task, task)
  end

  defp add_space_access(ctx, :no_access), do: ctx

  defp add_space_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.person.id, access_level: Binding.from_atom(level)}])
    ctx
  end

  defp add_project_access(ctx, :no_access), do: ctx

  defp add_project_access(ctx, level) do
    Factory.add_project_contributor(ctx, :contributor, :project, contributor: ctx.person, permissions: level)
  end

  defp assert_permission_result(task, 200, archived) do
    assert not is_nil(Repo.reload!(task).archived_at) == archived
  end

  defp assert_permission_result(task, _code, _archived), do: assert_archive_unchanged(task)

  defp assert_archive_unchanged(task) do
    assert Repo.reload!(task).archived_at == task.archived_at
    refute Repo.get_by(Activity, action: "task_archive_updating")
  end
end
