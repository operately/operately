defmodule OperatelyEmail.UpdateEmailTest do
  use Operately.DataCase
  use Bamboo.Test

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    author = person_fixture(%{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: author.id,
    })

    contributor1 = person_fixture(%{company_id: company.id})
    contributor2 = person_fixture(%{company_id: company.id})

    Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: contributor1.id,
      role: :contributor,
      responsibility: "Design"
    })

    Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: contributor2.id,
      role: :contributor,
      responsibility: "Development"
    })

    {:ok, update} = Operately.Updates.create_update(%{
      updatable_id: project.id,
      updatable_type: :project,
      project_id: project.id,
      author_id: author.id,
      type: :status_update,
      content: %{
        "old_health" => "on-track",
        "new_health" => "at-risk",
        "message" => %{
          "type" => "doc",
          "content" => [
            %{
              "type" => "paragraph",
              "content" => [
                %{
                  "text" => "Hello!",
                  "type" => "text"
                }
              ]
            }
          ]
        }
      }
    })

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
end
