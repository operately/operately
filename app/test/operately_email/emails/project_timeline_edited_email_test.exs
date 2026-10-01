defmodule OperatelyEmail.Emails.ProjectTimelineEditedEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.ProjectTimelineEditedEmail

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "renders zero, singular and plural durations from persisted dates", ctx do
    for {days, english, portuguese} <- [{0, "0 days", "0 dias"}, {1, "1 day", "1 dia"}, {3, "3 days", "3 dias"}, {7, "1 week", "1 semana"}, {14, "2 weeks", "2 semanas"}] do
      activity =
        activity_fixture(%{
          action: "project_timeline_edited",
          author_id: ctx.creator.id,
          content: %{
            "project_id" => ctx.project.id,
            "new_milestones" => [],
            "old_start_date" => nil,
            "old_end_date" => nil,
            "new_start_date" => "2026-01-01",
            "new_end_date" => Date.add(~D[2026-01-01], days) |> Date.to_iso8601()
          }
        })
        |> Operately.Repo.reload!()

      for {locale, expected} <- [{"en", "The duration is now #{english}."}, {"pt_BR", "A duração agora é #{portuguese}."}] do
        Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
          ProjectTimelineEditedEmail.send(ctx.creator, activity)
        end)

        assert_email_sent(fn email -> String.contains?(email.html_body, expected) end)
      end
    end
  end
end
