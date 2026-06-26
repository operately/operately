defmodule OperatelyWeb.Api.Tasks.ListTaskStatusesTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:tasks, :list_task_statuses], %{})
    end
  end

  describe "validation" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "it requires a task_id", ctx do
      assert {400, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{})
      assert res.message == "Missing required fields: task_id"
    end

    test "returns not found for unknown task", ctx do
      assert {404, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Ecto.UUID.generate()})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "company members have no access", ctx do
      task = create_task(ctx, company_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert res.message == "The requested resource was not found"
    end

    test "company members have access", ctx do
      task = create_task(ctx, company_access: Binding.view_access())
      project = Repo.preload(task, :project).project

      assert {200, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert_statuses_match(res.task_statuses, project.task_statuses)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert res.message == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access: Binding.view_access())
      project = Repo.preload(task, :project).project

      assert {200, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert_statuses_match(res.task_statuses, project.task_statuses)
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "returns statuses for a project task", ctx do
      task = create_task(ctx, company_access: Binding.view_access())
      project = Repo.preload(task, :project).project

      assert {200, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert length(res.task_statuses) > 0
      assert Enum.any?(res.task_statuses, &(&1.value == "done"))
      assert_statuses_match(res.task_statuses, project.task_statuses)
    end

    test "returns statuses for a space task", ctx do
      add_person_to_space(ctx)

      task =
        task_fixture(%{
          creator_id: ctx.creator.id,
          space_id: ctx.space.id,
          name: "Space Task"
        })

      space = Repo.preload(task, :space).space

      assert {200, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert length(res.task_statuses) > 0
      assert_statuses_match(res.task_statuses, space.task_statuses)
    end
  end

  defp create_task(ctx, opts) do
    project =
      project_fixture(%{
        company_id: ctx.company.id,
        name: "Project",
        creator_id: ctx.creator.id,
        champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
        reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
        group_id: Keyword.get(opts, :space_id, ctx.space.id),
        company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
        space_access_level: Keyword.get(opts, :space_access, Binding.no_access())
      })

    milestone = milestone_fixture(%{project_id: project.id})

    task_fixture(%{creator_id: ctx.creator.id, milestone_id: milestone.id, project_id: project.id})
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [
      %{
        id: ctx.person.id,
        access_level: Binding.edit_access()
      }
    ])
  end

  defp assert_statuses_match(serialized_statuses, statuses) do
    assert length(serialized_statuses) == length(statuses)

    Enum.zip(serialized_statuses, statuses)
    |> Enum.each(fn {serialized, status} ->
      assert serialized.id == status.id
      assert serialized.label == status.label
      assert serialized.value == status.value
    end)
  end
end
