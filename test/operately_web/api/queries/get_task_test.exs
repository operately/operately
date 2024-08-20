defmodule OperatelyWeb.Api.Queries.GetTaskTest do
  use OperatelyWeb.TurboCase

  import OperatelyWeb.Api.Serializer
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_task, %{})
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

      assert {404, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.message == "The requested resource was not found"
    end

    test "company members have access", ctx do
      task = create_task(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.task == serialize(task, level: :full)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.message == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.task == serialize(task, level: :full)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      task = create_task(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_task, %{id: Paths.task_id(task)})
      assert res.task == serialize(task, level: :full)

      # another user's request
      assert {404, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.message == "The requested resource was not found"
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      task = create_task(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_task, %{id: Paths.task_id(task)})
      assert res.task == serialize(task, level: :full)

      # another user's request
      assert {404, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "get_task functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "get a task with nothing included", ctx do
      task = create_task(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      assert res.task == serialize(task, level: :full)
    end

    test "include_assignees", ctx do
      task = create_task(ctx, company_access: Binding.view_access())
      assignee_fixture(task_id: task.id, person_id: ctx.person.id)

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task), include_assignees: true})
      assert res.task.assignees == [serialize(ctx.person)]

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      refute res.task.assignees
    end

    test "include_milestone", ctx do
      task = create_task(ctx, company_access: Binding.view_access())
      milestone = Repo.preload(task, [milestone: :project]).milestone

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task), include_milestone: true})
      m = %{res.task.milestone | status: to_string(res.task.milestone.status)}
      assert m == serialize(milestone)

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      refute res.task.milestone
    end

    test "include_project", ctx do
      task = create_task(ctx, company_access: Binding.view_access())
      project = Repo.preload(task, :project).project

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task), include_project: true})
      assert res.task.project == serialize(project)

      assert {200, res} = query(ctx.conn, :get_task, %{id: Paths.task_id(task)})
      refute res.task.project
    end
  end

  #
  # Helpers
  #

  defp create_task(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      name: "Project",
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      group_id: Keyword.get(opts, :space_id, ctx.space.id),
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })
    milestone = milestone_fixture(ctx.creator, %{ project_id: project.id })

    task_fixture(%{creator_id: ctx.creator.id, milestone_id: milestone.id})
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
