defmodule Operately.Features.AssignmentsEmailTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps

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
    link = UI.Emails.find_link(email, "Check-In")

    ctx
    |> UI.visit(link)
    |> UI.assert_text("What's new since the last check-in?")
  end
end
