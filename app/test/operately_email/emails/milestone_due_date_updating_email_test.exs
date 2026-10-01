defmodule OperatelyEmail.Emails.MilestoneDueDateUpdatingEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.MilestoneDueDateUpdatingEmail

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project, title: "Launch")
  end

  test "buffered item renders a persisted due date change", ctx do
    activity = persisted_activity(ctx, date("2026-09-11", "Sep 11, 2026"), date("2026-09-14", "Sep 14, 2026"))

    item = MilestoneDueDateUpdatingEmail.buffered_item(ctx.creator, activity)

    assert item.headline == "changed the due date of the milestone \"Launch\" to Sep 14, 2026"
  end

  test "buffered item renders a persisted due date being set", ctx do
    activity = persisted_activity(ctx, nil, date("2026-09-11", "Sep 11, 2026"))

    item = MilestoneDueDateUpdatingEmail.buffered_item(ctx.creator, activity)

    assert item.headline == "set the due date of the milestone \"Launch\" to Sep 11, 2026"
  end

  test "buffered item renders a persisted due date being removed", ctx do
    activity = persisted_activity(ctx, date("2026-09-11", "Sep 11, 2026"), nil)

    item = MilestoneDueDateUpdatingEmail.buffered_item(ctx.creator, activity)

    assert item.headline == "removed the due date from the milestone \"Launch\""
  end

  test "send renders persisted old and new due dates", ctx do
    activity = persisted_activity(ctx, date("2026-09-11", "Sep 11, 2026"), date("2026-09-14", "Sep 14, 2026"))

    MilestoneDueDateUpdatingEmail.send(ctx.creator, activity)

    assert_email_sent(fn email ->
      assert email.html_body =~ "The due date was changed from Sep 11, 2026 to Sep 14, 2026."
      true
    end)
  end

  test "renders Portuguese due date changes without translating the milestone name or stored date", ctx do
    activity = persisted_activity(ctx, date("2026-09-11", "Sep 11, 2026"), date("2026-09-14", "Sep 14, 2026"))

    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      MilestoneDueDateUpdatingEmail.send(ctx.creator, activity)
    end)

    assert_email_sent(fn email ->
      assert email.subject =~ "alterou a data de conclusão de \"Launch\""
      assert email.html_body =~ "A data de conclusão foi alterada de Sep 11, 2026 para Sep 14, 2026."
      assert email.html_body =~ "Ver projeto"
      assert email.text_body =~ "alterou a data de conclusão de Launch."
      true
    end)
  end

  defp persisted_activity(ctx, old_date, new_date) do
    activity_fixture(%{
      author_id: ctx.creator.id,
      action: "milestone_due_date_updating",
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "old_due_date" => old_date,
        "new_due_date" => new_date
      }
    })
    |> Operately.Repo.reload!()
  end

  defp date(date, value), do: %{date: date, date_type: "day", value: value}
end
