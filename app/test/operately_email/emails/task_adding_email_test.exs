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

  test "renders Portuguese copy when i18n is enabled for a pt-BR recipient", ctx do
    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    {:ok, person} = Operately.People.update_person(ctx.recipient, %{language: "pt-BR"})
    person = %{person | company: company}
    activity = task_adding_activity(ctx)

    flush_emails()

    Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
      TaskAddingEmail.send(person, activity)
    end)

    assert_email_sent(fn email ->
      assert email.subject == "(Paper Expansion) Michael S. adicionou a tarefa \"Call leads\""
      assert email.html_body =~ "Uma nova tarefa chamada Call leads foi criada neste projeto."
      assert email.html_body =~ "Ver tarefa"
      assert email.text_body =~ "Michael S. adicionou a tarefa \"Call leads\"."
      task_url = OperatelyWeb.Paths.task_path(ctx.company, ctx.task) |> OperatelyWeb.Paths.to_url()
      assert email.text_body =~ "Link: #{task_url}"
      true
    end)
  end

  test "renders each recipient in their own language without leaking locale", ctx do
    previous = Gettext.get_locale(OperatelyWeb.Gettext)
    Gettext.put_locale(OperatelyWeb.Gettext, "en")
    on_exit(fn -> Gettext.put_locale(OperatelyWeb.Gettext, previous) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    {:ok, portuguese} = Operately.People.update_person(ctx.recipient, %{language: "pt-BR"})
    portuguese = %{portuguese | company: company}
    english = %{ctx.author | company: company}
    activity = task_adding_activity(ctx)

    flush_emails()

    Operately.I18n.EffectiveLanguage.with_locale(portuguese, fn ->
      TaskAddingEmail.send(portuguese, activity)
    end)

    Operately.I18n.EffectiveLanguage.with_locale(english, fn ->
      TaskAddingEmail.send(english, activity)
    end)

    assert_email_sent(fn email ->
      email_to?(email, portuguese) &&
        email.html_body =~ "Uma nova tarefa chamada Call leads foi criada neste projeto." &&
        email.text_body =~ "adicionou a tarefa" &&
        not String.contains?(email.html_body, "A new task named")
    end)

    assert_email_sent(fn email ->
      email_to?(email, english) &&
        email.html_body =~ "A new task named Call leads was created in this project." &&
        email.text_body =~ "added the task" &&
        not String.contains?(email.html_body, "Uma nova tarefa")
    end)

    assert Gettext.get_locale(OperatelyWeb.Gettext) == "en"
  end

  test "translates the digest headline at render time", ctx do
    activity = task_adding_activity(ctx)

    item = TaskAddingEmail.buffered_item(ctx.recipient, activity)

    assert item.headline == "created the task \"Call leads\""
    assert item.parent_name == ctx.project.name
  end

  test "translates the digest headline into Portuguese at render time", ctx do
    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    {:ok, person} = Operately.People.update_person(ctx.recipient, %{language: "pt-BR"})
    person = %{person | company: company}
    activity = task_adding_activity(ctx)

    item =
      Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
        TaskAddingEmail.buffered_item(person, activity)
      end)

    assert item.headline == "criou a tarefa \"Call leads\""
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

  defp email_to?(email, person) do
    Enum.any?(List.wrap(email.to), fn
      {_name, address} -> address == person.email
      address when is_binary(address) -> address == person.email
    end)
  end
end
