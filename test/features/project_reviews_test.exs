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
  feature "request a review", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "request-review-button")
    |> UI.fill_rich_text("The project was paused for a while, let's review it before we continue.")
    |> UI.click(testid: "request-review-submit-button")
    |> UI.assert_text(first_name(ctx.reviewer) <> " requested an Impromptu Review")
    |> UI.click(testid: "request-review-link")
    |> UI.assert_text("The project was paused for a while, let's review it before we continue.")
    |> UI.assert_email_sent("Operately (#{ctx.company.name}): #{Person.short_name(ctx.reviewer)} requested a review for #{ctx.project.name}", to: ctx.champion.email)
  end

  @tag login_as: :champion
  feature "submit a requested review", ctx do
    {:ok, _} = Operately.Projects.create_review_request(ctx.reviewer, %{
      project_id: ctx.project.id,
      content: rich_text("The project was paused for a while, let's review it before we continue.")
    })

    ctx
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
    ctx
    |> UI.assert_text("Impromptu Project Review")
    |> UI.assert_text("This review was requested by #{first_name(ctx.reviewer)}")
    |> UI.click(testid: "review-request-link")
    |> UI.assert_text("View Submitted Review")

    # The review request should be marked as completed
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.refute_text("Request Review")

    # assert that the reviewew received an email
    ctx
    |> UI.assert_email_sent("Operately (#{ctx.company.name}): #{Person.short_name(ctx.champion)} submitted a review for #{ctx.project.name}", to: ctx.reviewer.email)
  end

  @tag login_as: :champion
  feature "changing phase from pending -> execution and filling in the review", ctx do
    ctx 
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:execution)
    |> fill_survey([
      {"schedule", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"costs", "yes", "Yes, the execution phase was completed within budget."},
      {"team", "yes", "The team was not staffed with suitable roles because of X, Y, and Z."},
      {"risks", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"deliverables", "- Deliverable 1\n- Deliverable 2\n- Deliverable 3"},
    ])

    ctx
    |> UI.assert_text("The project has moved to the Execution phase")
  end

  @tag login_as: :champion
  feature "changing phase from execution -> control and filling in the review", ctx do
    change_phase(ctx.project, :execution)

    ctx 
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:control)
    |> fill_survey([
      {"schedule", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"costs", "yes", "Yes, the execution phase was completed within budget."},
      {"team", "yes", "The team was not staffed with suitable roles because of X, Y, and Z."},
      {"risks", "yes", "The project was not completed on schedule because of X, Y, and Z."},
      {"deliverables", "- Deliverable 1\n- Deliverable 2\n- Deliverable 3"},
    ])

    ctx
    |> UI.assert_text("The project has moved to the Control phase")
  end

  @tag login_as: :champion
  feature "changing phase from control -> completed and filling in a retrospective", ctx do
    change_phase(ctx.project, :control)

    ctx
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:completed)
    |> fill_survey([
      {"what-went-well", "The project was completed on schedule."},
      {"what-could-be-better", "The project could have been completed on budget."},
      {"what-we-learned", "We learned that we need to improve our budgeting process."},
    ])

    ctx
    |> UI.assert_text("The project was completed")
  end

  @tag login_as: :champion
  feature "changing phase from control -> canceled and filling in a retrospective", ctx do
    change_phase(ctx.project, :control)

    ctx
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:canceled)
    |> fill_survey([
      {"what-went-well", "The project was completed on schedule."},
      {"what-could-be-better", "The project could have been completed on budget."},
      {"what-we-learned", "We learned that we need to improve our budgeting process."},
    ])

    ctx
    |> UI.assert_text("The project was canceled")
  end

  @tag login_as: :champion
  feature "pausing a project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:paused)
    |> fill_survey([
      {"why-are-you-pausing", "We are pausing the project because of X, Y, and Z."},
      {"when-will-you-resume", "We will resume the project on X date."},
    ])
    |> UI.assert_text("The project was paused")
  end

  @tag login_as: :champion
  feature "changing phase from control -> planning and filling in a the questions", ctx do
    change_phase(ctx.project, :control)

    ctx
    |> ProjectSteps.visit_project_page()
    |> initiate_phase_change(:planning)
    |> fill_survey([
      {"why-are-you-switching-back", "We are switching back to the planning phase because of X, Y, and Z."}
    ])
    |> UI.assert_text("The project reverted to the Planning phase")
  end

  @tag login_as: :champion
  feature "changing phase from completed -> planning and filling in a the questions", ctx do
    change_phase(ctx.project, :completed)

    ctx
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

  defp fill_survey(ctx, answers) do
    Enum.each(answers, fn answer ->
      case answer do
        {question, answer, comment} ->
          ctx
          |> UI.find(testid: "question-#{question}")
          |> UI.click(testid: "question-#{question}-#{answer}")
          |> UI.fill_rich_text(comment)

        {question, answer} ->
          ctx
          |> UI.find(testid: "question-#{question}")
          |> UI.fill_rich_text(answer)
      end
    end)

    ctx
    |> UI.scroll_to(testid: "submit-area")
    |> UI.click(testid: "submit-button")
  end

  defp change_phase(project, phase) do
    {:ok, _} = Operately.Projects.update_project(project, %{phase: phase})
  end

  defp initiate_phase_change(ctx, phase) do
    ctx
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-#{phase}")
  end
end
