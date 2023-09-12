defmodule OperatelyEmail.UpdateEmailTest do
  use Operately.DataCase
  use Bamboo.Test

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    author = person_fixture(%{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: author.id})

    contributor1 = add_contibutor(project, "Design")
    contributor2 = add_contibutor(project, "Development")

    content = Operately.UpdatesFixtures.rich_text_fixture("Hello!")

    {:ok, update} = Operately.Updates.record_status_update(author, project, "on_track", content)

    {:ok, %{
      company: company, 
      project: project, 
      update: update, 
      contributor1: contributor1, 
      contributor2: contributor2
    }}
  end

  test "sends an email to the project contributors", ctx do
    assert_email_delivered_with(to: [{nil, ctx.contributor1.email}])
    assert_email_delivered_with(to: [{nil, ctx.contributor2.email}])
  end

  defp add_contibutor(project, responsibility) do
    person = person_fixture(%{company_id: project.company_id})

    Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: person.id,
      role: :contributor,
      responsibility: responsibility
    })

    person
  end
end
