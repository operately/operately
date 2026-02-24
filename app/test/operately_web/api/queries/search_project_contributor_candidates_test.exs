defmodule OperatelyWeb.Api.Queries.SearchProjectContributorCandidatesTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Repo, People}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :search_project_contributor_candidates, %{})
    end

    test "doesn't show people from other companies", ctx do
      ctx1 = register_and_log_in_account(ctx)
      ctx2 = register_and_log_in_account(ctx)

      p1 = person_fixture(%{company_id: ctx1.company.id})
      p2 = person_fixture(%{company_id: ctx1.company.id})
      p3 = person_fixture(%{company_id: ctx2.company.id})
      p4 = person_fixture(%{company_id: ctx2.company.id})

      project1 = project_fixture(%{company_id: ctx1.company.id, creator_id: ctx1.person.id, group_id: ctx1.company.company_space_id})
      project2 = project_fixture(%{company_id: ctx2.company.id, creator_id: ctx2.person.id, group_id: ctx2.company.company_space_id})

      assert {200, res} = query(ctx1.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project1),
        query: "",
      })

      assert length(res.people) == 3
      Enum.each([p1, p2, ctx1.company_creator], fn p ->
        assert Enum.find(res.people, &(&1.id == Paths.person_id(p)))
      end)

      assert {200, res} = query(ctx2.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project2),
        query: "",
      })

      assert length(res.people) == 3
      Enum.each([p3, p4, ctx2.company_creator], fn p ->
        assert Enum.find(res.people, &(&1.id == Paths.person_id(p)))
      end)
    end
  end


  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      member = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: ctx.company_creator, member: member})
    end

    test "company members have no access", ctx do
      project = create_project(ctx, company_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert length(res.people) == 0
    end

    test "company members have access", ctx do
      project = create_project(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert_response(res, ctx)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert length(res.people) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert_response(res, ctx)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert_response(res, ctx)

      # another user's request
      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert length(res.people) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert_response(res, ctx)

      # another user's request
      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert length(res.people) == 0
    end

    test "suspended people don't have access", ctx do
      project = create_project(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert_response(res, ctx)

      People.update_person(ctx.person, %{suspended_at: DateTime.utc_now()})

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: "",
      })
      assert length(res.people) == 0
    end
  end

  describe "search_project_contributor_candidates functionality" do
    setup :register_and_log_in_account

    test "returns people based on query", ctx do
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.person.id,
        group_id: ctx.company.company_space_id
      })

      person = person_fixture(company_id: ctx.company.id)

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: person.full_name
      })

      assert res.people == [Serializer.serialize(person)]
    end

    test "doesn't return suspended people", ctx do
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.person.id,
        group_id: ctx.company.company_space_id
      })

      suspended_person = person_fixture(%{
        company_id: ctx.company.id,
        suspended: true,
        suspended_at: DateTime.utc_now()
      })

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: suspended_person.full_name
      })

      assert res.people == []
    end

    test "doesn't return AI agents", ctx do
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.person.id,
        group_id: ctx.company.company_space_id
      })

      ai_agent = person_fixture(%{
        company_id: ctx.company.id,
        full_name: "Test AI Agent",
        title: "Assistant",
        type: :ai
      })

      assert {200, res} = query(ctx.conn, :search_project_contributor_candidates, %{
        project_id: Paths.project_id(project),
        query: ai_agent.full_name
      })

      assert res.people == []
    end
  end

  #
  # Helpers
  #

  defp assert_response(res, ctx) do
    assert length(res.people) == 2
    assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.member)))
    assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person)))
  end

  defp create_project(ctx, opts) do
    project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      group_id: ctx.space.id,
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })
  end


  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end
end
