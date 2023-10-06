defmodule Operately.Features.ProjectReviewsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.Support.RichText

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()
    champion = UI.get_account().person
    project = create_project(company, champion)

    {:ok, %{session: session, company: company, champion: champion, project: project}}
  end

  feature "request a review", state do
    champion = person_fixture(%{full_name: "John Wick", title: "Head of Operations", company_id: state.company.id})
    reviewer = state.champion

    change_champion(state.project, champion)
    change_reviewer(state.project, reviewer)

    state
    |> visit_page(state.project)
    |> UI.click(testid: "request-review-button")
    |> UI.fill_rich_text("The project was paused for a while, let's review it before we continue.")
    |> UI.click(testid: "request-review-submit-button")
    |> UI.assert_text(first_name(reviewer) <> " requested an Impromptu Review")
    |> UI.click(testid: "request-review-link")
    |> UI.assert_text("The project was paused for a while, let's review it before we continue.")
  end

  feature "submit a requested review", state do
    reviewer = person_fixture(%{full_name: "John Wick", title: "Head of Operations", company_id: state.company.id})
    change_reviewer(state.project, reviewer)

    {:ok, _} = Operately.Projects.create_review_request(reviewer, %{
      project_id: state.project.id,
      content: rich_text("The project was paused for a while, let's review it before we continue.")
    })

    state
    |> visit_page(state.project)
    |> UI.click(testid: "request-review-link")
    |> UI.click(testid: "write-review-button")
    |> fill_survey([
      {"schedule", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"costs", "yes", "Yes, the execution phase was completed within budget."},
      {"team", "yes", "The team was not staffed with suitable roles because of X, Y, and Z."},
      {"risks", "yes", "The project was not completed on schedule because of X, Y, and Z."},
    ])

    # The review is submitted and the user is redirected to the review page
    state
    |> UI.assert_text("Impromptu Project Review")
    |> UI.assert_text("This review was requested by #{first_name(reviewer)}")
    |> UI.click(testid: "review-request-link")
    |> UI.assert_text("View Submitted Review")

    # The review request should be marked as completed
    state
    |> visit_page(state.project)
    |> UI.refute_text("Request Review")
  end

  feature "changing phase from pending -> execution and filling in the review", state do
    state 
    |> visit_page(state.project)
    |> initiate_phase_change(:execution)
    |> fill_survey([
      {"schedule", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"costs", "yes", "Yes, the execution phase was completed within budget."},
      {"team", "yes", "The team was not staffed with suitable roles because of X, Y, and Z."},
      {"risks", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"deliverables", "- Deliverable 1\n- Deliverable 2\n- Deliverable 3"},
    ])

    state
    |> UI.assert_text("The project has moved to the Execution phase")
  end

  feature "changing phase from execution -> control and filling in the review", state do
    change_phase(state.project, :execution)

    state 
    |> visit_page(state.project)
    |> initiate_phase_change(:control)
    |> fill_survey([
      {"schedule", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"costs", "yes", "Yes, the execution phase was completed within budget."},
      {"team", "yes", "The team was not staffed with suitable roles because of X, Y, and Z."},
      {"risks", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"deliverables", "- Deliverable 1\n- Deliverable 2\n- Deliverable 3"},
    ])

    state
    |> UI.assert_text("The project has moved to the Control phase")
  end

  feature "changing phase from control -> completed and filling in a retrospective", state do
    change_phase(state.project, :control)

    state
    |> visit_page(state.project)
    |> initiate_phase_change(:completed)
    |> fill_survey([
      {"what-went-well", "The project was completed on schedule."},
      {"what-could-be-better", "The project could have been completed on budget."},
      {"what-we-learned", "We learned that we need to improve our budgeting process."},
    ])

    state
    |> UI.assert_text("The project was completed")
  end

  feature "changing phase from control -> canceled and filling in a retrospective", state do
    change_phase(state.project, :control)

    state
    |> visit_page(state.project)
    |> initiate_phase_change(:canceled)
    |> fill_survey([
      {"what-went-well", "The project was completed on schedule."},
      {"what-could-be-better", "The project could have been completed on budget."},
      {"what-we-learned", "We learned that we need to improve our budgeting process."},
    ])

    state
    |> UI.assert_text("The project was canceled")
  end

  feature "pausing a project", state do
    state
    |> visit_page(state.project)
    |> initiate_phase_change(:paused)
    |> fill_survey([
      {"why-are-you-pausing", "We are pausing the project because of X, Y, and Z."},
      {"when-will-you-resume", "We will resume the project on X date."},
    ])
    |> UI.assert_text("The project was paused")
  end

  feature "changing phase from control -> planning and filling in a the questions", state do
    change_phase(state.project, :control)

    state
    |> visit_page(state.project)
    |> initiate_phase_change(:planning)
    |> fill_survey([
      {"why-are-you-switching-back", "We are switching back to the planning phase because of X, Y, and Z."}
    ])
    |> UI.assert_text("The project reverted to the Planning phase")
  end

  feature "changing phase from completed -> planning and filling in a the questions", state do
    change_phase(state.project, :completed)

    state
    |> visit_page(state.project)
    |> initiate_phase_change(:planning)
    |> fill_survey([
      {"why-are-you-restarting", "We are restarting the project because of X, Y, and Z."}
    ])
    |> UI.assert_text("The project reverted to the Planning phase")
  end

  #
  # Helpers
  #

  defp visit_page(state, project) do
    UI.visit(state, "/projects" <> "/" <> project.id)
  end

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

  defp add_contributor(project, person, role, responsibility \\ " ") do
    {:ok, _} = Operately.Projects.create_contributor(%{
      person_id: person.id, 
      role: role, 
      project_id: project.id, 
      responsibility: responsibility
    })
  end

  defp change_champion(project, champion) do
    delete_contributors_with_role(project, "champion")
    add_contributor(project, champion, "champion")
  end

  defp change_reviewer(project, reviewer) do
    delete_contributors_with_role(project, "reviewer")
    add_contributor(project, reviewer, "reviewer")
  end

  defp delete_contributors_with_role(project, role) do
    Operately.Projects.list_project_contributors(project)
    |> Enum.filter(fn contributor -> contributor.role == role end)
    |> Enum.map(&Operately.Projects.delete_contributor(&1))
  end

  defp first_name(person) do
    String.split(person.full_name, " ") |> List.first()
  end

  defp fill_survey(state, answers) do
    Enum.each(answers, fn answer ->
      case answer do
        {question, answer, comment} ->
          state
          |> UI.find(testid: "question-#{question}")
          |> UI.click(testid: "question-#{question}-#{answer}")
          |> UI.fill_rich_text(comment)

        {question, answer} ->
          state
          |> UI.find(testid: "question-#{question}")
          |> UI.fill_rich_text(answer)
      end
    end)

    state
    |> UI.scroll_to(testid: "submit-area")
    |> UI.click(testid: "submit-button")
  end

  defp change_phase(project, phase) do
    {:ok, _} = Operately.Projects.update_project(project, %{phase: phase})
  end

  defp initiate_phase_change(state, phase) do
    state
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-#{phase}")
  end
end
