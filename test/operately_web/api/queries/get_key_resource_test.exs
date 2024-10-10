defmodule OperatelyWeb.Api.Queries.GetKeyResourceTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  alias Operately.{Repo, People}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_key_resource, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: ctx.company_creator})
    end

    test "company members have no access", ctx do
      key_resource = create_key_resource(ctx, company_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.message == "The requested resource was not found"
    end

    test "company members have access", ctx do
      key_resource = create_key_resource(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.key_resource == key_resource
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      key_resource = create_key_resource(ctx, space_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.message == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      key_resource = create_key_resource(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.key_resource == key_resource
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      key_resource = create_key_resource(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_key_resource, %{id: key_resource.id})
      assert res.key_resource == key_resource

      # another user's request
      assert {404, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.message == "The requested resource was not found"
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      key_resource = create_key_resource(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_key_resource, %{id: key_resource.id})
      assert res.key_resource == key_resource

      # another user's request
      assert {404, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.message == "The requested resource was not found"
    end

    test "suspended people don't have access", ctx do
      key_resource = create_key_resource(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.key_resource == key_resource

      People.update_person(ctx.person, %{suspended_at: DateTime.utc_now()})

      assert {404, res} = query(ctx.conn, :get_key_resource, %{id: key_resource.id})
      assert res.message == "The requested resource was not found"
    end
  end

  #
  # Helpers
  #

  defp create_key_resource(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      group_id: ctx.space.id,
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })
    key_resource_fixture(%{project_id: project.id})
    |> Repo.preload(:project)
    |> Serializer.serialize(level: :full)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end
end
