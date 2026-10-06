defmodule OperatelyEmail.Emails.ProjectDueDateUpdatingEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.ProjectDueDateUpdatingEmail

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
  end

  test "formats dates in both email bodies and buffered items in the recipient locale", ctx do
    activity = activity_fixture(%{
      action: "project_due_date_updating",
      author_id: ctx.creator.id,
      content: %{"project_id" => ctx.project.id, "old_due_date" => "2026-01-01", "new_due_date" => "2026-02-02"}
    }) |> Operately.Repo.reload!()

    for {locale, previous_date, new_date} <- [{"en", "Jan 1, 2026", "Feb 2, 2026"}, {"pt_BR", "1 de jan. de 2026", "2 de fev. de 2026"}, {"fr", "Jan 1, 2026", "Feb 2, 2026"}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        ProjectDueDateUpdatingEmail.send(ctx.creator, activity)
        assert_email_sent(fn email ->
          Enum.all?([email.html_body, email.text_body], fn body ->
            String.contains?(body, previous_date) and String.contains?(body, new_date)
          end)
        end)
        item = ProjectDueDateUpdatingEmail.buffered_item(ctx.creator, activity)
        assert item.headline =~ new_date
        assert item.parent_name == ctx.project.name
      end)
    end
    assert activity.content["new_due_date"] == "2026-02-02"
  end
end
