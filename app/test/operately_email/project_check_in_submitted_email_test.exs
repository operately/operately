defmodule OperatelyEmail.ProjectCheckInSubmittedEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias OperatelyEmail.Emails.ProjectCheckInSubmittedEmail
  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_space_member(:editor, :space)
    |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
    |> Factory.add_project_check_in(:check_in, :project, :champion)
    |> update_check_in_description()
    |> then(&{:ok, &1})
  end

  test "buffered item links the parent to the project and the update to the check-in", ctx do
    activity =
      activity_fixture(%{
        action: "project_check_in_submitted",
        author_id: ctx.champion.id,
        content: %{"project_id" => ctx.project.id, "check_in_id" => ctx.check_in.id}
      })

    item = ProjectCheckInSubmittedEmail.buffered_item(ctx.champion, activity)

    assert item.parent_url == Paths.project_path(ctx.company, ctx.project) |> Paths.to_url()
    assert item.item_url == Paths.project_check_in_path(ctx.company, ctx.check_in) |> Paths.to_url()
  end

  test "reviewer gets an Acknowledge CTA with the auto-ack URL", ctx do
    send_check_in_email(ctx, ctx.reviewer)
    assert_acknowledge_email()
  end

  test "champion gets a View Check-In CTA when they authored the check-in", ctx do
    send_check_in_email(ctx, ctx.champion)
    assert_view_check_in_email()
  end

  test "reviewer gets a View Check-In CTA when they authored the check-in", ctx do
    ctx = add_reviewer_check_in(ctx)

    send_check_in_email(ctx, ctx.reviewer, ctx.reviewer_check_in)
    assert_view_check_in_email()
  end

  test "champion gets an Acknowledge CTA when they did not author the check-in", ctx do
    ctx = add_reviewer_check_in(ctx)

    send_check_in_email(ctx, ctx.champion, ctx.reviewer_check_in)
    assert_acknowledge_email()
  end

  test "company owner gets a View Check-In CTA", ctx do
    send_check_in_email(ctx, ctx.owner)
    assert_view_check_in_email()
  end

  test "space member who is not champion or reviewer gets a View Check-In CTA", ctx do
    send_check_in_email(ctx, ctx.editor)
    assert_view_check_in_email()
  end

  defp add_reviewer_check_in(ctx) do
    ctx
    |> Factory.add_project_check_in(:reviewer_check_in, :project, :reviewer)
    |> then(fn ctx ->
      {:ok, check_in} =
        Operately.Projects.CheckIn.changeset(ctx.reviewer_check_in, %{
          description: RichText.rich_text("Progress update")
        })
        |> Operately.Repo.update()

      Map.put(ctx, :reviewer_check_in, check_in)
    end)
  end

  defp send_check_in_email(ctx, person), do: send_check_in_email(ctx, person, ctx.check_in)

  defp send_check_in_email(ctx, person, check_in) do
    activity =
      activity_fixture(%{
        action: "project_check_in_submitted",
        author_id: check_in.author_id,
        content: %{"project_id" => ctx.project.id, "check_in_id" => check_in.id}
      })

    flush_emails()
    ProjectCheckInSubmittedEmail.send(person, activity)
  end

  defp assert_acknowledge_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">Acknowledge</a>"
      assert email.html_body =~ "acknowledge=true"
      assert email.text_body =~ "Acknowledge:"
      refute email.html_body =~ ">View Check-In</a>"
      true
    end)
  end

  defp assert_view_check_in_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">View Check-In</a>"
      assert email.text_body =~ "View Check-In:"
      refute email.html_body =~ ">Acknowledge</a>"
      refute email.html_body =~ "acknowledge=true"
      refute email.text_body =~ "Acknowledge:"
      true
    end)
  end

  defp update_check_in_description(ctx) do
    {:ok, check_in} =
      Operately.Projects.CheckIn.changeset(ctx.check_in, %{
        description: RichText.rich_text("Progress update")
      })
      |> Operately.Repo.update()

    Map.put(ctx, :check_in, check_in)
  end

  defp flush_emails do
    receive do
      {:email, _email} -> flush_emails()
      {:emails, _emails} -> flush_emails()
    after
      0 -> :ok
    end
  end
end
