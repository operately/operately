defmodule OperatelyEmail.ProjectContributorAddedEmailTest do
  use Operately.DataCase
  use Bamboo.Test

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  setup do
    company = company_fixture()
    author = person_fixture(%{company_id: company.id})
    group = group_fixture(author, %{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: author.id, group_id: group.id})

    person = person_fixture(%{company_id: project.company_id})

    {:ok, contributor} = Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: person.id,
      role: :reviewer,
      responsibility: " "
    })

    {:ok, _} = Operately.Updates.record_project_contributor_added(author, project.id, contributor)

    {:ok, %{company: company, project: project, person: person}}
  end

  test "sends an email to the project contributors", ctx do
    assert_email_delivered_with(to: [{nil, ctx.person.email}])
  end
end
