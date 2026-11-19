defmodule OperatelyEmail.Emails.TaskAssigneeUpdatingEmailTest do
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
      |> Factory.add_company_member(:other_assignee, name: "Jim Halpert")
      |> Factory.add_space(:space, name: "Sales")
      |> Factory.add_project(:project, :space, name: "Paper Expansion")
      |> Factory.add_project_milestone(:milestone, :project, title: "Launch")
      |> Factory.add_project_task(:task, :milestone, name: "Call leads")

    {:ok, ctx}
  end

  test "renders Portuguese and English according to recipient preferences", ctx do
    {:ok, person} = Operately.People.update_person(ctx.assignee, %{language: "pt-BR"})
    previous_locale = Gettext.get_locale(OperatelyWeb.Gettext)

    for {language, portuguese?} <- [{"pt-BR", true}, {"en", false}] do
      person = %{person | language: language}

      Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
        flush_emails()
        TaskAssigneeUpdatingEmail.send(person, assignee_updating_activity(ctx))
      end)

      assert_email_sent(fn email ->
        if portuguese? do
          assert email.subject =~ "atribuiu a você a tarefa Call leads"
          assert email.html_body =~ "Você agora é responsável por esta tarefa."
          assert email.text_body =~ "atribuiu a você a tarefa Call leads"
        else
          refute email.subject =~ "atribuiu a você a tarefa Call leads"
          refute email.html_body =~ "Você agora é responsável por esta tarefa."
        end
        refute email.html_body =~ "%{"
        refute email.text_body =~ "%{"
        true
      end)
      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale
    end
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

  test "tells each new assignee they were assigned when multiple people are added", ctx do
    activity =
      activity_fixture(%{
        author_id: ctx.author.id,
        action: "task_assignee_updating",
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.space.id,
          "project_id" => ctx.project.id,
          "milestone_id" => ctx.milestone.id,
          "task_id" => ctx.task.id,
          "old_assignee_id" => nil,
          "new_assignee_id" => nil,
          "added_assignee_ids" => [ctx.assignee.id, ctx.other_assignee.id],
          "removed_assignee_ids" => []
        }
      })

    flush_emails()
    TaskAssigneeUpdatingEmail.send(ctx.other_assignee, activity)

    assert_email_sent(fn email ->
      assert email.subject =~ "Michael S. assigned you the task Call leads"
      assert email.html_body =~ "Michael S. assigned you the task Call leads"
      assert email.html_body =~ "You are now assigned to this task."
      assert email.text_body =~ "Michael S. assigned you the task Call leads."
      assert email.text_body =~ "You are now assigned to this task."
      refute email.html_body =~ "Dwight S."
      true
    end)
  end

  test "skips sending when the task no longer exists", ctx do
    activity = assignee_updating_activity(ctx)
    Operately.Repo.delete!(ctx.task)

    flush_emails()
    assert :skip = TaskAssigneeUpdatingEmail.send(ctx.assignee, activity)
    refute_email_sent()
  end

  test "skips digest items when the task no longer exists", ctx do
    activity = assignee_updating_activity(ctx)
    Operately.Repo.delete!(ctx.task)

    assert :skip = TaskAssigneeUpdatingEmail.buffered_item(ctx.assignee, activity)
  end

  defp assignee_updating_activity(ctx) do
    activity_fixture(%{
      author_id: ctx.author.id,
      action: "task_assignee_updating",
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "task_id" => ctx.task.id,
        "old_assignee_id" => nil,
        "new_assignee_id" => ctx.assignee.id
      }
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
