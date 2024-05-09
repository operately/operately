defmodule OperatelyEmail.ProjectCreatedEmailTest do
  use Operately.DataCase
  use Bamboo.Test

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()

    champion = person_fixture_with_account(%{company_id: company.id, email: "b@tex.com"})
    reviewer = person_fixture_with_account(%{company_id: company.id, email: "a@tex.com"})

    group = group_fixture(champion, %{company_id: company.id})

    project = Operately.Projects.create_project(%Operately.Operations.ProjectCreation{
      company_id: company.id,
      name: "Hello",
      creator_id: reviewer.id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      group_id: group.id,
    })

    {:ok, %{
      company: company, 
      project: project, 
      champion: champion,
      reviewer: reviewer,
    }}
  end

  test "sends an email to the project contributors", ctx do
    assert_email_delivered_with(to: [{nil, ctx.champion.email}])
  end
end
