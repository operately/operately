defmodule OperatelyWeb.Api.Queries.GetProjectCheckInsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_project_check_ins, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      space_id = Paths.space_id(space)

      Map.merge(ctx, %{space: space, space_id: space_id, creator: creator})
    end

    test "company members have no access", ctx do
      {project_id, _} = create_project_and_check_ins(ctx, company_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :get_project_check_ins, %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "company members have access", ctx do
      {project_id, check_ins} = create_project_and_check_ins(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project_check_ins, %{project_id: project_id})
      assert_check_ins(res, check_ins)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      {project_id, _} = create_project_and_check_ins(ctx, space_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :get_project_check_ins, %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      {project_id, check_ins} = create_project_and_check_ins(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project_check_ins, %{project_id: project_id})
      assert_check_ins(res, check_ins)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      {project_id, check_ins} = create_project_and_check_ins(ctx, champion_id: champion.id)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} = query(conn, :get_project_check_ins, %{project_id: project_id})
      assert assert_check_ins(res, check_ins)

      # another user's request
      assert {200, res} = query(ctx.conn, :get_project_check_ins, %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {project_id, check_ins} = create_project_and_check_ins(ctx, reviewer_id: reviewer.id)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} = query(conn, :get_project_check_ins, %{project_id: project_id})
      assert assert_check_ins(res, check_ins)

      # another user's request
      assert {200, res} = query(ctx.conn, :get_project_check_ins, %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end
  end

  #
  # Helpers
  #

  defp create_project_and_check_ins(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      group_id: ctx.space.id,
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })
    check_ins = Enum.map(1..3, fn _ ->
      check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
    end)

    project_id = Paths.project_id(project)

    {project_id, check_ins}
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp assert_check_ins(res, check_ins) do
    assert length(res.project_check_ins) == length(check_ins)
    Enum.each(res.project_check_ins, fn c ->
      assert Enum.find(check_ins, &(Paths.project_check_in_id(&1) == c.id))
    end)
  end
end
