defmodule OperatelyWeb.Api.Mutations.ChangeTaskDescriptionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures
  import Operately.Support.RichText

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :change_task_description, %{})
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
      task = create_task(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, task, "content")
      assert res.message == "The requested resource was not found"
      refute_description_changed(task)
    end

    test "company members without edit access can't change task description", ctx do
      task = create_task(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, task, "content")
      assert res.message == "You don't have permission to perform this action"
      refute_description_changed(task)
    end

    test "company members with edit access can change task description", ctx do
      task = create_task(ctx, company_access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, task, "new description")
      assert_description_changed(task, "new description")
    end

    test "company owner can change task description", ctx do
      task = create_task(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, task, "content")
      refute_description_changed(task)

      # Admin
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, task, "new description")
      assert_description_changed(task, "new description")
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, task, "content")
      assert res.message == "The requested resource was not found"
      refute_description_changed(task)
    end

    test "space members without edit access can't change task description", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, task, "content")
      assert res.message == "You don't have permission to perform this action"
      refute_description_changed(task)
    end

    test "space members with edit access can change task description", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, task, "new description")
      assert_description_changed(task, "new description")
    end

    test "space managers can change task description", ctx do
      add_person_to_space(ctx)
      task = create_task(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, task, "content")
      refute_description_changed(task)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = request(ctx.conn, task, "content")
      assert_description_changed(task, "content")
    end

    test "contributors without edit access can't change task description", ctx do
      task = create_task(ctx)
      contributor = create_contributor(ctx, task, Binding.comment_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} = request(conn, task, "content")
      assert res.message == "You don't have permission to perform this action"
      refute_description_changed(task)
    end

    test "contributors with edit access can change task description", ctx do
      task = create_task(ctx)
      contributor = create_contributor(ctx, task, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, task, "new description")
      assert_description_changed(task, "new description")
    end

    test "champions can change task description", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      task = create_task(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, task, "content")
      refute_description_changed(task)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, task, "new description")
      assert_description_changed(task, "new description")
    end

    test "reviewers can change task description", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      task = create_task(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, task, "content")
      refute_description_changed(task)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, task, "description")
      assert_description_changed(task, "description")
    end
  end

  describe "change_task_description functionality" do
    setup :register_and_log_in_account

    test "changes task description", ctx do
      task = create_task(ctx)

      assert task.description == %{}

      assert {200, res} = request(ctx.conn, task, "content")

      task = Repo.reload(task)

      assert task.description == rich_text("content")
      assert res.task == Serializer.serialize(task, level: :essential)
    end
  end

  #
  # Steps
  #

  defp request(conn, task, content) do
    mutation(conn, :change_task_description, %{
      task_id: Paths.task_id(task),
      description: rich_text(content) |> Jason.encode!(),
    })
  end

  defp refute_description_changed(task) do
    updated_task = Repo.reload(task)
    assert task.description == updated_task.description
  end

  defp assert_description_changed(task, new_content) do
    updated_task = Repo.reload(task)

    refute task.description == updated_task.description
    assert updated_task.description == rich_text(new_content)
  end

  #
  # Helpers
  #

  defp create_task(ctx, attrs \\ []) do
    project = project_fixture(Enum.into(attrs, %{
      company_id: ctx.company.id,
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
    milestone = milestone_fixture(ctx[:creator] || ctx.person, %{project_id: project.id})

    task_fixture(%{
      creator_id: ctx[:creator_id] || ctx.person.id,
      milestone_id: milestone.id,
    })
  end

  defp create_contributor(ctx, task, permissions) do
    contributor = person_fixture_with_account(%{company_id: ctx.company.id})
    project = Repo.preload(task, :project).project

    {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
      project_id: project.id,
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
