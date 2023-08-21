defmodule Operately.Projects.ListQueryTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id)
    project = project_fixture(%{company_id: company.id, creator_id: person.id})
    group = group_fixture()

    {:ok, %{
      company: company, 
      person: person, 
      project: project,
      group: group
    }}
  end

  test "listing projects for a group where the members are the champion of the project", ctx do
    Operately.Groups.add_member(ctx.group, ctx.person.id)

    Operately.Projects.create_contributor(%{
      project_id: ctx.project.id,
      person_id: ctx.person.id,
      role: "champion"
    })

    query = Operately.Projects.ListQuery.build(%{
      group_id: ctx.group.id,
      group_member_roles: ["champion"]
    })

    project_ids = Operately.Repo.all(query) |> Enum.map(& &1.id)

    assert Enum.member?(project_ids, ctx.project.id)
  end
end
