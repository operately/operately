defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdateTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_goal_progress_update, %{})
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
      update_id = create_update(ctx, company_access: Binding.no_access())

      forbidden_request(ctx.conn, update_id)
    end

    test "company members have access", ctx do
      update_id = create_update(ctx, company_access: Binding.view_access())

      allowed_request(ctx.conn, update_id)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      update_id = create_update(ctx, space_access: Binding.no_access())

      forbidden_request(ctx.conn, update_id)
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      update_id = create_update(ctx, space_access: Binding.view_access())

      allowed_request(ctx.conn, update_id)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      update_id = create_update(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      allowed_request(conn, update_id)

      # other user's request
      forbidden_request(ctx.conn, update_id)
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      update_id = create_update(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      allowed_request(conn, update_id)

      # other user's request
      forbidden_request(ctx.conn, update_id)
    end
  end

  #
  # Helpers
  #

  defp allowed_request(conn, update_id) do
    assert {200, %{update: update} = _res} = query(conn, :get_goal_progress_update, %{id: update_id})

    assert update.id == update_id
    assert update.author
    assert update.goal
    assert update.goal.permissions
    assert update.goal.targets
  end

  defp forbidden_request(conn, update_id) do
    assert {404, %{message: msg} = _res} = query(conn, :get_goal_progress_update, %{id: update_id})
    assert msg == "The requested resource was not found"
  end

  defp create_update(ctx, opts) do
    company_access = Keyword.get(opts, :company_access, Binding.no_access())
    space_access = Keyword.get(opts, :space_access, Binding.no_access())
    champion_id = Keyword.get(opts, :champion_id, ctx.creator.id)
    reviewer_id = Keyword.get(opts, :reviewer_id, ctx.creator.id)

    goal = goal_fixture(ctx.creator, %{
      space_id: ctx.space.id,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      company_access_level: company_access,
      space_access_level: space_access,
    })
    {:ok, update} = Operately.Operations.GoalCheckIn.run(ctx.creator, goal, RichText.rich_text("content"), [])
    update_id = Paths.goal_update_id(update)

    update_id
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
