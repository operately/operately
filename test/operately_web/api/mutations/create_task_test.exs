defmodule OperatelyWeb.Api.Mutations.CreateTaskTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Repo, Tasks}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_task, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, creator_id: creator.id, space_id: space.id})
    end

    test "company members without view access can't see a project", ctx do
      milestone = create_milestone(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, milestone)
      assert res.message == "The requested resource was not found"
      refute_task_created(milestone)
    end

    test "company members without edit access can't create task", ctx do
      milestone = create_milestone(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, milestone)
      assert res.message == "You don't have permission to perform this action"
      refute_task_created(milestone)
    end

    test "company members with edit access can create task", ctx do
      milestone = create_milestone(ctx, company_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, milestone)
      assert_task_created(res)
    end

    test "company owners can create task", ctx do
      milestone = create_milestone(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, milestone)
      refute_task_created(milestone)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, milestone)
      assert_task_created(res)
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      milestone = create_milestone(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, milestone)
      assert res.message == "The requested resource was not found"
      refute_task_created(milestone)
    end

    test "space members without edit access can't create task", ctx do
      add_person_to_space(ctx)
      milestone = create_milestone(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, milestone)
      assert res.message == "You don't have permission to perform this action"
      refute_task_created(milestone)
    end

    test "space members with edit access can create task", ctx do
      add_person_to_space(ctx)
      milestone = create_milestone(ctx, space_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, milestone)
      assert_task_created(res)
    end

    test "space managers can create task", ctx do
      add_person_to_space(ctx)
      milestone = create_milestone(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, milestone)
      refute_task_created(milestone)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, milestone)
      assert_task_created(res)
    end

    test "contributors without edit access can't create task", ctx do
      milestone = create_milestone(ctx)
      contributor = create_contributor(ctx, milestone, Binding.comment_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} = request(conn, milestone)
      assert res.message == "You don't have permission to perform this action"
      refute_task_created(milestone)
    end

    test "contributors with edit access can create task", ctx do
      milestone = create_milestone(ctx)
      contributor = create_contributor(ctx, milestone, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, milestone)
      assert_task_created(res)
    end

    test "champions can create task", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      milestone = create_milestone(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, milestone)
      refute_task_created(milestone)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, milestone)
      assert_task_created(res)
    end

    test "reviewers can create task", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      milestone = create_milestone(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, milestone)
      refute_task_created(milestone)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, milestone)
      assert_task_created(res)
    end
  end

  describe "create_task functionality" do
    setup :register_and_log_in_account

    test "creates task", ctx do
      p1 = person_fixture(%{company_id: ctx.company.id})
      p2 = person_fixture(%{company_id: ctx.company.id})
      milestone = create_milestone(ctx)

      assert {200, res} = request(ctx.conn, milestone, [p1, p2])
      assert_task_created(res)
      assert_task_assignees(res, [p1, p2])
    end

    test "creates task without assignee", ctx do
      milestone = create_milestone(ctx)

      assert {200, res} = request(ctx.conn, milestone, [])
      assert_task_created(res)
      assert_task_assignees(res, [])
    end
  end

  #
  # Steps
  #

  defp request(conn, milestone, assignees \\ []) do
    mutation(conn, :create_task, %{
      name: "some task",
      assignee_ids: Enum.map(assignees, &(Paths.person_id(&1))),
      description: rich_text("content") |> Jason.encode!(),
      milestone_id: Paths.milestone_id(milestone),
    })
  end

  defp assert_task_created(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.task.id)

    task = Tasks.get_task!(id)

    assert task.name == "some task"
    assert res.task == Serializer.serialize(task, level: :essential)
  end

  defp assert_task_assignees(res, people) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.task.id)

    task = Tasks.get_task!(id)
    assignees = Tasks.list_task_assignees(task)

    assert length(assignees) == length(people)
    Enum.each(assignees, fn a ->
      assert Enum.find(people, &(&1.id == a.person_id))
    end)
  end

  defp refute_task_created(milestone) do
    assert Tasks.list_tasks(%{milestone_id: milestone.id}) == []
  end

  #
  # Helpers
  #

  defp create_milestone(ctx, attrs \\ []) do
    project = project_fixture(Enum.into(attrs, %{
      company_id: ctx.company.id,
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
    milestone_fixture(ctx[:creator] || ctx.person, %{project_id: project.id})
  end

  defp create_contributor(ctx, milestone, permissions) do
    contributor = person_fixture_with_account(%{company_id: ctx.company.id})

    {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
      project_id: milestone.project_id,
      person_id: contributor.id,
      responsibility: "some responsibility",
      permissions: permissions,
    })
    contributor
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end
end
