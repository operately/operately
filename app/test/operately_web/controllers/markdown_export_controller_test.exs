defmodule OperatelyWeb.MarkdownExportControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias OperatelyWeb.Paths

  setup :register_and_log_in_account

  test "project export includes the resources required by the markdown renderer", ctx do
    space = group_fixture(ctx.person, company_id: ctx.company.id, name: "Growth")
    goal = goal_fixture(ctx.person, %{company_id: ctx.company.id, space_id: space.id, name: "Increase Revenue"})

    project =
      project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.person.id,
        group_id: space.id,
        goal_id: goal.id,
        name: "Paid Acquisition"
      })

    milestone_fixture(%{project_id: project.id, creator_id: ctx.person.id, title: "Landing Page"})
    check_in_fixture(%{project_id: project.id, author_id: ctx.person.id})

    contributor = person_fixture(company_id: ctx.company.id, full_name: "Jordan Contributor")

    {:ok, _} =
      Operately.Projects.create_contributor(contributor, %{
        person_id: contributor.id,
        responsibility: "Growth Engineer",
        project_id: project.id,
        permissions: Binding.edit_access()
      })

    conn = get(ctx.conn, Paths.export_project_markdown_path(ctx.company, project))

    assert conn.status == 200
    assert get_resp_header(conn, "content-type") == ["text/markdown"]
    assert conn.resp_body =~ "Space: #{space.name}"
    assert conn.resp_body =~ "Parent Goal: #{goal.name}"
    assert conn.resp_body =~ "## Contributors"
    assert conn.resp_body =~ contributor.full_name
    assert conn.resp_body =~ "## Milestones"
    assert conn.resp_body =~ "## Check-ins"
  end

  test "goal export includes the resources required by the markdown renderer", ctx do
    space = group_fixture(ctx.person, company_id: ctx.company.id, name: "Growth")
    reviewer = person_fixture(company_id: ctx.company.id, full_name: "Robin Reviewer", title: "VP Sales")

    goal =
      goal_fixture(ctx.person,
        company_id: ctx.company.id,
        space_id: space.id,
        name: "Increase Revenue",
        champion_id: ctx.person.id,
        reviewer_id: reviewer.id
      )

    project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.person.id,
      group_id: space.id,
      goal_id: goal.id,
      name: "Funnel Optimization"
    })

    goal_update_fixture(ctx.person, goal)

    conn = get(ctx.conn, Paths.export_goal_markdown_path(ctx.company, goal))

    assert conn.status == 200
    assert get_resp_header(conn, "content-type") == ["text/markdown"]
    assert conn.resp_body =~ "Space: #{space.name}"
    assert conn.resp_body =~ "Champion: #{ctx.person.full_name}"
    assert conn.resp_body =~ "Reviewer: #{reviewer.full_name}"
    assert conn.resp_body =~ "## Related Projects"
    assert conn.resp_body =~ "Funnel Optimization"
    assert conn.resp_body =~ "## Check-ins"
  end
end
