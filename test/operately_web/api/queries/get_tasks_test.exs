defmodule OperatelyWeb.Api.Queries.GetTasksTest do
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
      assert {401, _} = query(ctx.conn, :get_tasks, %{})
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
      {milestone_id, _} = create_tasks(ctx, company_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert 0 == length(res.tasks)
    end

    test "company members have access", ctx do
      {milestone_id, tasks} = create_tasks(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert_tasks(res, tasks)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      {milestone_id, _} = create_tasks(ctx, space_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert 0 == length(res.tasks)
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      {milestone_id, tasks} = create_tasks(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert_tasks(res, tasks)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      {milestone_id, tasks} = create_tasks(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_tasks, %{milestone_id: milestone_id})
      assert_tasks(res, tasks)

      # another user's request
      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert 0 == length(res.tasks)
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {milestone_id, tasks} = create_tasks(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_tasks, %{milestone_id: milestone_id})
      assert_tasks(res, tasks)

      # another user's request
      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert 0 == length(res.tasks)
    end
  end

  describe "get_tasks functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "get tasks with nothing included", ctx do
      {milestone_id, tasks} = create_tasks(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      assert_tasks(res, tasks)
    end

    test "include_assignees", ctx do
      {milestone_id, tasks} = create_tasks(ctx, company_access: Binding.view_access())
      Enum.each(tasks, fn t ->
        assignee_fixture(task_id: t.id, person_id: ctx.person.id)
      end)

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id, include_assignees: true})
      Enum.each(res.tasks, fn t ->
        assert t.assignees == [serialize(ctx.person)]
      end)

      assert {200, res} = query(ctx.conn, :get_tasks, %{milestone_id: milestone_id})
      Enum.each(res.tasks, fn t ->
        refute t.assignees
      end)
    end
  end

  #
  # Helpers
  #

  defp assert_tasks(res, tasks) do
    assert length(res.tasks) == length(tasks)
    Enum.each(res.tasks, fn t ->
      assert Enum.find(tasks, &(t == serialize(&1, level: :full)))
    end)
  end

  defp create_tasks(ctx, opts) do
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
    tasks = Enum.map(1..3, fn _ ->
      task_fixture(%{creator_id: ctx.creator.id, milestone_id: milestone.id})
    end)

    {Paths.milestone_id(milestone), tasks}
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end
end
