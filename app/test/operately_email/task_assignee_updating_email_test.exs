defmodule OperatelyEmail.TaskAssigneeUpdatingEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.TaskAssigneeUpdatingEmail

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:author, name: "Michael Scott")
      |> Factory.add_company_member(:assignee, name: "Dwight Schrute")
      |> Factory.add_space(:space, name: "Sales")
      |> Factory.add_project(:project, :space, name: "Paper Expansion")
      |> Factory.add_project_milestone(:milestone, :project, title: "Launch")
      |> Factory.add_project_task(:task, :milestone, name: "Call leads")

    {:ok, ctx}
  end

  test "tells the new assignee they were assigned the task", ctx do
    activity = activity_fixture(%{
      author_id: ctx.author.id,
      action: "task_assignee_updating",
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "task_id" => ctx.task.id,
        "old_assignee_id" => nil,
        "new_assignee_id" => ctx.assignee.id,
      }
    })

    flush_emails()
    TaskAssigneeUpdatingEmail.send(ctx.assignee, activity)

    assert_email_sent(fn email ->
      assert email.subject =~ "Michael S. assigned you the task Call leads"
      assert email.html_body =~ "Michael S. assigned you the task Call leads"
      assert email.html_body =~ "You are now assigned to this task."
      assert email.text_body =~ "Michael S. assigned you the task Call leads."
      assert email.text_body =~ "You are now assigned to this task."
      refute email.subject =~ "changed the assignee"
      refute email.html_body =~ "The assignee is now Dwight S."
      true
    end)
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
