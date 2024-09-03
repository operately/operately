defmodule OperatelyWeb.Api.Queries.GetProjectCheckInTest do
  use OperatelyWeb.TurboCase

  import OperatelyWeb.Api.Serializer
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  alias Operately.{Repo, Notifications}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_project_check_in, %{})
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
      check_in = create_check_in(ctx, company_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end

    test "company members have access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, champion_id: champion.id)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} = query(conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in

      # another user's request
      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, reviewer_id: reviewer.id)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} = query(conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in

      # another user's request
      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "get_project_check_in functionality" do
    setup :register_and_log_in_account

    test "include_subscribers", ctx do
      project = project_fixture(%{company_id: ctx.company.id, group_id: ctx.company.company_space_id, creator_id: ctx.person.id})
      check_in = check_in_fixture(%{author_id: ctx.person.id, project_id: project.id})
      list = Notifications.get_subscription_list!(parent_id: check_in.id)

      people = Enum.map(1..3, fn _ ->
        person = person_fixture(%{company_id: ctx.company.id})
        Notifications.create_subscription(%{
          subscription_list_id: list.id,
          person_id: person.id,
          type: :invited,
        })
        person
      end)

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: check_in.id,
        include_subscribers: true,
      })

      Enum.each(res.project_check_in.subscription_list.subscriptions, fn s ->
        assert Enum.find(people, &(serialize(&1) == s.person))
      end)
    end
  end

  #
  # Helpers
  #

  defp create_check_in(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      group_id: ctx.space.id,
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })

    check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
    |> serialize(level: :full)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
