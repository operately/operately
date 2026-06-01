defmodule OperatelyEmail.TaskDescriptionChangeEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyEmail.Emails.TaskDescriptionChangeEmail

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:author, name: "Michael Scott")
      |> Factory.add_company_member(:recipient, name: "Dwight Schrute")
      |> Factory.add_space(:space, name: "Sales")
      |> Factory.add_project(:project, :space, name: "Paper Expansion")
      |> Factory.add_project_milestone(:milestone, :project, title: "Launch")
      |> Factory.add_project_task(:task, :milestone, name: "Call leads")

    {:ok, ctx}
  end

  test "renders non-empty text body for mention emails", ctx do
    description = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()

    activity =
      activity_fixture(%{
        author_id: ctx.author.id,
        action: "task_description_change",
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.space.id,
          "project_id" => ctx.project.id,
          "milestone_id" => ctx.milestone.id,
          "task_id" => ctx.task.id,
          "task_name" => ctx.task.name,
          "description" => description,
          "has_description" => true
        }
      })

    flush_emails()
    TaskDescriptionChangeEmail.send(ctx.recipient, activity)

    assert_email_sent(fn email ->
      assert email.subject =~ "mentioned you"
      assert email.subject =~ "Call leads"
      assert String.trim(email.text_body) != ""
      assert email.text_body =~ "mentioned you"
      assert email.text_body =~ "Call leads"
      assert email.text_body =~ "Link:"
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
