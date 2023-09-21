defmodule Operately.Features.ProjectMilestonesTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  alias Operately.People.Person

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()
    champion = UI.get_account().person
    project = create_project(company, champion)

    {:ok, %{session: session, company: company, champion: champion, project: project}}
  end

  feature "adding milestones to a project", state do
    state
    |> visit_page(state.project)
    |> UI.click(testid: "show-all-milestones")
    |> UI.click(testid: "add-milestone")
    |> UI.fill(testid: "milestone-title", with: "Contract Signed")
    |> UI.click(testid: "milestone-due-date")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")
    |> UI.click(testid: "save-milestone")

    state
    |> UI.assert_text("Contract Signed")
    |> UI.assert_text(Person.short_name(state.champion) <> " added Contract Signed milestone")
  end

  feature "deleting a milestone on a project", state do
    add_milestone(state.project, state.champion, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

    state
    |> visit_page(state.project)
    |> UI.click(testid: "show-all-milestones")
    |> UI.click(testid: "delete-milestone")
    |> UI.assert_text(Person.short_name(state.champion) <> " deleted the Contract Signed milestone")
  end

  feature "see all milestones", state do
    add_milestone(state.project, state.champion, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})
    add_milestone(state.project, state.champion, %{title: "Demo Day", deadline_at: ~N[2023-07-17 00:00:00]})
    add_milestone(state.project, state.champion, %{title: "Website Launched", deadline_at: ~N[2023-07-17 00:00:00]})

    state
    |> visit_page(state.project)
    |> UI.find(testid: "timeline")
    |> UI.click(testid: "show-all-milestones")

    state
    |> UI.assert_text("Contract Signed", testid: "timeline")
    |> UI.assert_text("Demo Day", testid: "timeline")
    |> UI.assert_text("Website Launched", testid: "timeline")
  end

  feature "mark upcomming milestone completed", state do
    add_milestone(state.project, state.champion, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})
    add_milestone(state.project, state.champion, %{title: "Website Launched", deadline_at: ~N[2023-07-17 00:00:00]})

    state
    |> visit_page(state.project)
    |> UI.assert_text("Contract Signed", testid: "timeline")

    state
    |> UI.click(testid: "complete-milestone")

    state
    |> UI.refute_text("Contract Signed", testid: "timeline")
    |> UI.assert_text("Website Launched", testid: "timeline")

    state
    |> UI.assert_text(Person.short_name(state.champion) <> " marked Contract Signed as completed")
  end

  feature "mark milestone completed in the expanded list", state do
    add_milestone(state.project, state.champion, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00], completed_at: ~N[2023-06-17 00:00:00], status: "done"})
    add_milestone(state.project, state.champion, %{title: "Website Launched", deadline_at: ~N[2023-07-17 00:00:00]})

    state
    |> visit_page(state.project)
    |> UI.click(testid: "show-all-milestones")
    |> UI.click(testid: "complete-milestone")
    |> UI.assert_text(Person.short_name(state.champion) <> " marked Website Launched as completed")
  end

  feature "change milestone deadline", state do
    add_milestone(state.project, state.champion, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

    state
    |> visit_page(state.project)
    |> UI.click(testid: "show-all-milestones")
    |> UI.click(testid: "change-milestone-due-date")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")
    |> UI.assert_text(Person.short_name(state.champion) <> " changed the due date for Contract Signed")
  end

  feature "visiting the milestone page", state do
    {:ok, milestone} = add_milestone(state.project, state.champion, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

    state
    |> visit_page(state.project)
    |> UI.find(testid: "timeline")
    |> UI.click(testid: "show-all-milestones")
    |> UI.click(testid: "milestone-link-#{milestone.id}")

    state
    |> UI.assert_page("/projects/#{state.project.id}/milestones/#{milestone.id}")
    |> UI.assert_text("Contract Signed")
  end

  # ===========================================================================

  defp add_milestone(project, creator, attrs) do
    attrs = %{project_id: project.id} |> Map.merge(attrs)

    {:ok, _} = Operately.Projects.create_milestone(creator, attrs)
  end

  defp visit_page(state, project), do: UI.visit(state, "/projects" <> "/" <> project.id)

  defp create_project(company, champion) do
    params = %Operately.Projects.ProjectCreation{
      company_id: company.id,
      name: "Live support",
      champion_id: champion.id,
      creator_id: champion.id,
      creator_role: nil,
      visibility: "everyone",
    }

    {:ok, project} = Operately.Projects.create_project(params)

    project
  end
end
