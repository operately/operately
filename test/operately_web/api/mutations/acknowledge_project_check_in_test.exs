defmodule OperatelyWeb.Api.Mutations.AcknowledgeProjectCheckInTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :acknowledge_project_check_in, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see a check-in", ctx do
      check_in = create_project_and_check_ins(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, check_in)
      assert res.message == "The requested resource was not found"
    end

    test "company members can't acknowledge a check-in", ctx do
      check_in = create_project_and_check_ins(ctx, company_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, check_in)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members without view access can't see a check-in", ctx do
      add_person_to_space(ctx)
      check_in = create_project_and_check_ins(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, check_in)
      assert res.message == "The requested resource was not found"
    end

    test "space members can't acknowledge a check-in", ctx do
      add_person_to_space(ctx)
      check_in = create_project_and_check_ins(ctx, space_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, check_in)
      assert res.message == "You don't have permission to perform this action"
    end

    test "contributors can't acknowledge a check-in", ctx do
      check_in = create_project_and_check_ins(ctx, champion_id: ctx.person.id)

      assert {403, res} = request(ctx.conn, check_in)
      assert res.message == "You don't have permission to perform this action"
    end

    test "reviewers can acknowledge a check-in", ctx do
      check_in = create_project_and_check_ins(ctx, reviewer_id: ctx.person.id)

      assert {200, res} = request(ctx.conn, check_in)
      assert_response(res, check_in)
    end
  end

  describe "acknowledge_project_check_in functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "acknowledges check-in", ctx do
      check_in = create_project_and_check_ins(ctx, reviewer_id: ctx.person.id)

      refute check_in.acknowledged_at
      refute check_in.acknowledged_by_id

      assert {200, res} = request(ctx.conn, check_in)
      assert_response(res, check_in)
    end
  end

  #
  # Steps
  #

  defp request(conn, check_in) do
    mutation(conn, :acknowledge_project_check_in, %{id: Paths.project_check_in_id(check_in)})
  end

  defp assert_response(res, check_in) do
    check_in = Repo.reload(check_in)

    assert check_in.acknowledged_at
    assert check_in.acknowledged_by_id
    assert res.check_in == Serializer.serialize(check_in, level: :essential)
  end

  #
  # Helpers
  #

  defp create_project_and_check_ins(ctx, opts) do
    project = project_fixture(Enum.into(opts, %{
      company_id: ctx.company.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      creator_id: ctx.creator.id,
      company_access_level: Keyword.get(opts, :company_access_level, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access_level, Binding.no_access()),
    }))
    check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end
end
