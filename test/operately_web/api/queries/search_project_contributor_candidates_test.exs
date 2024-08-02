defmodule OperatelyWeb.Api.Queries.SearchProjectContributorCandidatesTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :search_project_contributor_candidates, %{})
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

      assert res.people == [%{
        id: Paths.person_id(person),
        full_name: person.full_name,
        title: person.title,
        avatar_url: person.avatar_url,
        has_open_invitation: false
      }]
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
  end
end 
