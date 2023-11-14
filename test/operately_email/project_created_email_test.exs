defmodule OperatelyEmail.ProjectCreatedEmailTest do
  use Operately.DataCase
  use Bamboo.Test

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    author = person_fixture(%{company_id: company.id})
    group = group_fixture(author, %{company_id: company.id})
    champion = person_fixture(%{company_id: company.id})

    project = Operately.Projects.create_project(%Operately.Projects.ProjectCreation{
      company_id: company.id,
      name: "Hello",
      champion_id: champion.id,
      creator_id: author.id,
      creator_role: "Reviewer",
      group_id: group.id,
    })

    {:ok, %{
      company: company, 
      project: project, 
      reviewer: author,
    }}
  end

  test "sends an email to the project contributors", ctx do
    assert_email_delivered_with(to: [{nil, ctx.reviewer.email}])
  end
end
