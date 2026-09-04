defmodule OperatelyEmail.ProjectClosedEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Swoosh.TestAssertions

  alias Operately.Activities.Activity
  alias OperatelyEmail.Emails.ProjectClosedEmail
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_owner(:owner)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_space_member(:reviewer, :space)
      |> Factory.add_space_member(:editor, :space)
      |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.close_project(:project, author: :champion)

    {:ok, ctx}
  end

  test "reviewer gets an Acknowledge CTA with the auto-ack URL", ctx do
    send_closed_email(ctx, ctx.reviewer)
    assert_acknowledge_email()
  end

  test "champion gets a View Retrospective CTA when they closed the project", ctx do
    send_closed_email(ctx, ctx.champion)
    assert_view_retrospective_email()
  end

  test "champion gets an Acknowledge CTA when the reviewer closed the project", ctx do
    ctx =
      ctx
      |> Factory.add_project(:reviewer_closed_project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.close_project(:reviewer_closed_project, author: :reviewer)

    send_closed_email(ctx, ctx.champion, ctx.reviewer_closed_project)
    assert_acknowledge_email()
  end

  test "reviewer and champion get an Acknowledge CTA when a third person closed the project", ctx do
    ctx =
      ctx
      |> Factory.add_project(:editor_closed_project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.close_project(:editor_closed_project, author: :editor)

    send_closed_email(ctx, ctx.reviewer, ctx.editor_closed_project)
    assert_acknowledge_email()

    send_closed_email(ctx, ctx.champion, ctx.editor_closed_project)
    assert_acknowledge_email()
  end

  test "company owner gets a View Retrospective CTA", ctx do
    send_closed_email(ctx, ctx.owner)
    assert_view_retrospective_email()
  end

  test "space member who is not champion or reviewer gets a View Retrospective CTA", ctx do
    send_closed_email(ctx, ctx.editor)
    assert_view_retrospective_email()
  end

  defp send_closed_email(ctx, person), do: send_closed_email(ctx, person, ctx.project)

  defp send_closed_email(_ctx, person, project) do
    flush_emails()
    ProjectClosedEmail.send(person, latest_project_closed(project))
  end

  defp assert_acknowledge_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">Acknowledge</a>"
      assert email.html_body =~ "acknowledge=true"
      refute email.html_body =~ ">View Retrospective</a>"
      true
    end)
  end

  defp assert_view_retrospective_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">View Retrospective</a>"
      refute email.html_body =~ ">Acknowledge</a>"
      refute email.html_body =~ "acknowledge=true"
      true
    end)
  end

  defp latest_project_closed(project) do
    from(a in Activity,
      where: a.action == "project_closed",
      where: a.content["project_id"] == ^project.id,
      order_by: [desc: a.inserted_at],
      limit: 1
    )
    |> Operately.Repo.one!()
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
