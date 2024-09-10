defmodule Operately.Projects.ContributorTest do
  use Operately.DataCase

  alias Operately.Projects.Contributor
  alias Operately.Access.Binding

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  describe "getter" do
    setup do
      company = company_fixture(%{name: "Test Org"})
      champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
      reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
      group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

      params = %Operately.Operations.ProjectCreation{
        company_id: company.id,
        name: "Hello World",
        champion_id: champion.id,
        reviewer_id: reviewer.id,
        creator_id: champion.id,
        creator_role: nil,
        visibility: "everyone",
        group_id: group.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.comment_access(),
      }

      {:ok, project} = Operately.Projects.create_project(params)

      contributors = Operately.Repo.preload(project, :contributors).contributors

      %{
        company: company, 
        champion: champion, 
        project: project, 
        reviewer: reviewer, 
        group: group,
        contributors: contributors,
        contrib: Enum.at(contributors, 0)
      }
    end

    test "get", ctx do
      assert_full_access Contributor.get(:system, id: ctx.contrib.id)
      assert_full_access Contributor.get(ctx.champion, id: ctx.contrib.id)
    end
  end
end
