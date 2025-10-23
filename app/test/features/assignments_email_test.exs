defmodule Operately.Features.AssignmentsEmailTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.AssignmentsEmailSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    UI.login_as(ctx, ctx.champion)
  end

  feature "receiving an assignment email for check-ins", ctx do
    one_hour_ago = DateTime.utc_now() |> DateTime.add(-1, :hour)
    {:ok, _} = Operately.Projects.update_project(ctx.project, %{next_check_in_scheduled_at: one_hour_ago})

    champion_with_account = Operately.Repo.preload(ctx.champion, :account)
    OperatelyEmail.Emails.AssignmentsEmail.send(champion_with_account)

    email = UI.Emails.last_sent_email()

    # Verify the email subject includes the company name
    company_name = ctx.company.name
    expected_subject = "#{company_name}: Your assignments for today"
    assert email.subject == expected_subject

    link = UI.Emails.find_link(email, "Check-In")

    ctx
    |> UI.visit(link)
    |> UI.assert_text("What's new since the last check-in?")
  end

  describe "assignments email v2" do
    setup _ctx do
      {:ok, Steps.setup_review_v2()}
    end

    feature "groups champion assignments by origin with urgent items", ctx do
      ctx
      |> Steps.prepare_champion_work()
      |> Steps.prepare_champion_reviews()
      |> Steps.reload_person(:champion)
      |> Steps.send_assignments_email_to_champion()
      |> Steps.assert_champion_email_contains_urgent_work()
    end

    feature "includes reviewer assignments with clear review labels", ctx do
      ctx
      |> Steps.prepare_reviewer_reviews()
      |> Steps.reload_person(:reviewer)
      |> Steps.send_assignments_email_to_reviewer()
      |> Steps.assert_reviewer_email_contains_review_assignments()
    end
  end
end
