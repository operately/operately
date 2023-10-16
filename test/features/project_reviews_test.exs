defmodule Operately.Features.ProjectReviewsTest do
  use Operately.FeatureCase

  alias Operately.People.Person

  alias Operately.Support.Features.ProjectSteps
  import Operately.Support.RichText

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :reviewer
  feature "request a review", state do
    state
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "request-review-button")
    |> UI.fill_rich_text("The project was paused for a while, let's review it before we continue.")
    |> UI.click(testid: "request-review-submit-button")
    |> UI.assert_text(first_name(state.reviewer) <> " requested an Impromptu Review")
    |> UI.click(testid: "request-review-link")
    |> UI.assert_text("The project was paused for a while, let's review it before we continue.")
    |> UI.assert_email_sent("Operately (#{state.company.name}): #{Person.short_name(state.reviewer)} requested a review for #{state.project.name}", to: state.champion.email)
  end

  @tag login_as: :champion
  feature "submit a requested review", state do
    {:ok, _} = Operately.Projects.create_review_request(state.reviewer, %{
      project_id: state.project.id,
      content: rich_text("The project was paused for a while, let's review it before we continue.")
    })

    state
    |> ProjectSteps.visit_project_page()
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
    |> UI.assert_text("This review was requested by #{first_name(state.reviewer)}")
    |> UI.click(testid: "review-request-link")
    |> UI.assert_text("View Submitted Review")

    # The review request should be marked as completed
    state
    |> ProjectSteps.visit_project_page()
    |> UI.refute_text("Request Review")

    # assert that the reviewew received an email
    state
    |> UI.assert_email_sent("Operately (#{state.company.name}): #{Person.short_name(state.champion)} submitted a review for #{state.project.name}", to: state.reviewer.email)
  end

  @tag login_as: :champion
  feature "changing phase from pending -> execution and filling in the review", state do
    state 
    |> ProjectSteps.visit_project_page()
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

  @tag login_as: :champion
  feature "changing phase from execution -> control and filling in the review", state do
    change_phase(state.project, :execution)

    state 
    |> ProjectSteps.visit_project_page()
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

  @tag login_as: :champion
  feature "changing phase from control -> completed and filling in a retrospective", state do
    change_phase(state.project, :control)

    state
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:completed)
    |> fill_survey([
      {"what-went-well", "The project was completed on schedule."},
      {"what-could-be-better", "The project could have been completed on budget."},
      {"what-we-learned", "We learned that we need to improve our budgeting process."},
    ])

    state
    |> UI.assert_text("The project was completed")
  end

  @tag login_as: :champion
  feature "changing phase from control -> canceled and filling in a retrospective", state do
    change_phase(state.project, :control)

    state
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:canceled)
    |> fill_survey([
      {"what-went-well", "The project was completed on schedule."},
      {"what-could-be-better", "The project could have been completed on budget."},
      {"what-we-learned", "We learned that we need to improve our budgeting process."},
    ])

    state
    |> UI.assert_text("The project was canceled")
  end

  @tag login_as: :champion
  feature "pausing a project", state do
    state
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:paused)
    |> fill_survey([
      {"why-are-you-pausing", "We are pausing the project because of X, Y, and Z."},
      {"when-will-you-resume", "We will resume the project on X date."},
    ])
    |> UI.assert_text("The project was paused")
  end

  @tag login_as: :champion
  feature "changing phase from control -> planning and filling in a the questions", state do
    change_phase(state.project, :control)

    state
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:planning)
    |> fill_survey([
      {"why-are-you-switching-back", "We are switching back to the planning phase because of X, Y, and Z."}
    ])
    |> UI.assert_text("The project reverted to the Planning phase")
  end

  @tag login_as: :champion
  feature "changing phase from completed -> planning and filling in a the questions", state do
    change_phase(state.project, :completed)

    state
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:planning)
    |> fill_survey([
      {"why-are-you-restarting", "We are restarting the project because of X, Y, and Z."}
    ])
    |> UI.assert_text("The project reverted to the Planning phase")
  end

  #
  # Helpers
  #

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
