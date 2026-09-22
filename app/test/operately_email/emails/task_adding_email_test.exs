defmodule OperatelyEmail.Emails.TaskAddingEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyEmail.Emails.TaskAddingEmail

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

  test "renders English copy for a new task", ctx do
    activity = task_adding_activity(ctx)

    flush_emails()
    TaskAddingEmail.send(ctx.recipient, activity)

    assert_email_sent(fn email ->
      assert email.subject == "(Paper Expansion) Michael S. added the task \"Call leads\""
      assert email.html_body =~ "Michael S. added the task"
      assert email.html_body =~ "Call leads"
      assert email.html_body =~ "A new task named Call leads was created in this project."
      assert email.html_body =~ "View Task"
      assert email.text_body =~ "Michael S. added the task \"Call leads\"."
      task_url = OperatelyWeb.Paths.task_path(ctx.company, ctx.task) |> OperatelyWeb.Paths.to_url()
      assert email.text_body =~ "Link: #{task_url}"
      refute email.html_body =~ "mentioned you"
      true
    end)
  end

  test "renders English copy when the recipient is mentioned", ctx do
    description = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    activity = task_adding_activity(ctx, %{"description" => description})

    flush_emails()
    TaskAddingEmail.send(ctx.recipient, activity)

    assert_email_sent(fn email ->
      assert email.subject == "(Paper Expansion) Michael S. mentioned you in the description for \"Call leads\""
      assert email.html_body =~ "You were mentioned in the description for Call leads."
      assert email.text_body =~ "Michael S. mentioned you in the description for \"Call leads\"."
      true
    end)
  end

  test "keeps English copy when i18n is disabled for a pt-BR recipient", ctx do
    {:ok, person} = Operately.People.update_person(ctx.recipient, %{language: "pt-BR"})
    person = %{person | company: ctx.company}
    activity = task_adding_activity(ctx)

    flush_emails()

    Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
      TaskAddingEmail.send(person, activity)
    end)

    assert_email_sent(fn email ->
      assert email.subject == "(Paper Expansion) Michael S. added the task \"Call leads\""
      assert email.html_body =~ "A new task named Call leads was created in this project."
      true
    end)
  end

  test "translates the digest headline at render time", ctx do
    activity = task_adding_activity(ctx)

    item = TaskAddingEmail.buffered_item(ctx.recipient, activity)

    assert item.headline == "created the task \"Call leads\""
    assert item.parent_name == ctx.project.name
  end

  defp task_adding_activity(ctx, extra \\ %{}) do
    activity_fixture(%{
      author_id: ctx.author.id,
      action: "task_adding",
      content:
        Map.merge(
          %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "project_id" => ctx.project.id,
            "milestone_id" => ctx.milestone.id,
            "task_id" => ctx.task.id,
            "name" => ctx.task.name
          },
          extra
        )
    })
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
