defmodule OperatelyEmail.Emails.AssignmentsEmailTest do
  use Operately.DataCase

  import Mock
  import Swoosh.TestAssertions
  import Operately.KpisFixtures

  alias Operately.ContextualDates.ContextualDate
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths
  alias OperatelyEmail.Emails.AssignmentsEmail

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Product")
      |> Factory.add_space_member(:first_assignee, :space, name: "Alice Assignee")
      |> Factory.add_space_member(:second_assignee, :space, name: "Bob Assignee")
      |> Factory.add_project(:project, :space, name: "Shared Project")

    pending = Enum.find(ctx.project.task_statuses, &(&1.color == :gray)) |> Map.from_struct()

    ctx =
      ctx
      |> Factory.add_project_task(:task, nil,
        project_id: ctx.project.id,
        name: "Shared urgent task",
        task_status: pending,
        due_date: Date.utc_today() |> Date.add(1) |> ContextualDate.create_day_date()
      )
      |> Factory.add_task_assignee(:first_task_assignee, :task, :first_assignee)
      |> Factory.add_task_assignee(:second_task_assignee, :task, :second_assignee)

    {:ok, ctx}
  end

  test "sends assignment reminder emails to every task assignee", ctx do
    flush_emails()

    AssignmentsEmail.send(ctx.first_assignee)
    AssignmentsEmail.send(ctx.second_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.subject == "#{ctx.company.name}: Your work for today" and
        email.html_body =~ "Tasks, reminders, and reviews that need your attention today." and
        email.text_body =~ "Tasks, reminders, and reviews that need your attention today." and
        email.html_body =~ "Shared urgent task"
    end)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.second_assignee.email}] and
        email.subject == "#{ctx.company.name}: Your work for today" and
        email.html_body =~ "Shared urgent task"
    end)
  end

  test "includes pending KPI updates for the champion", ctx do
    flush_emails()

    kpi =
      kpi_fixture(ctx.first_assignee,
        space_id: ctx.space.id,
        champion_id: ctx.first_assignee.id,
        name: "Weekly sign-ups",
        cadence: :weekly
      )

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.html_body =~ "Weekly sign-ups" and
        email.html_body =~ "Log update for Weekly sign-ups" and
        email.html_body =~ Paths.to_url(Paths.space_kpi_path(ctx.company, ctx.space, kpi))
    end)
  end

  test "sends the baseline assignment reminder one day before a task is due", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> Date.add(1) |> ContextualDate.create_day_date() |> Map.from_struct()
      })

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.subject == "#{ctx.company.name}: Your work for today" and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Due tomorrow"
    end)
  end

  test "falls back to due-status reminders for existing tasks without reminder rules", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> Date.add(1) |> ContextualDate.create_day_date() |> Map.from_struct(),
        reminders: []
      })

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.subject == "#{ctx.company.name}: Your work for today" and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Due tomorrow"
    end)
  end

  test "explicit reminders only mode skips baseline due-status reminders", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> Date.add(1) |> ContextualDate.create_day_date() |> Map.from_struct(),
        reminders: []
      })

    AssignmentsEmail.send(ctx.first_assignee, mode: :explicit_reminders_only)

    refute_email_sent()
  end

  test "sends a custom before-due reminder", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> Date.add(3) |> ContextualDate.create_day_date() |> Map.from_struct(),
        reminders: [
          %{type: :before_due, days: 3}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Reminder for today" and
        email.html_body =~ "Due in 3 days"
    end)
  end

  test "explicit reminders only mode sends matching custom reminders", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: nil,
        reminders: [
          %{type: :on_date, date: Date.utc_today()}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee, mode: :explicit_reminders_only)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Reminder for today" and
        email.html_body =~ "No due date"
    end)
  end

  test "does not send when task reminders do not match today", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> Date.add(1) |> ContextualDate.create_day_date() |> Map.from_struct(),
        reminders: [
          %{type: :before_due, days: 3}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee)

    refute_email_sent()
  end

  test "sends due-day reminders", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> ContextualDate.create_day_date() |> Map.from_struct(),
        reminders: [
          %{type: :due_day}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Due today"
    end)
  end

  test "sends on-date reminders for tasks without due dates", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: nil,
        reminders: [
          %{type: :on_date, date: Date.utc_today()}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Reminder for today" and
        email.html_body =~ "No due date"
    end)
  end

  test "sends overdue reminders", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: Date.utc_today() |> Date.add(-2) |> ContextualDate.create_day_date() |> Map.from_struct(),
        reminders: [
          %{type: :overdue}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Overdue by 2 days"
    end)
  end

  test "does not send when on-date reminders do not match today", ctx do
    flush_emails()

    {:ok, _task} =
      Operately.Tasks.update_task(ctx.task, %{
        due_date: nil,
        reminders: [
          %{type: :on_date, date: Date.add(Date.utc_today(), 1)}
        ]
      })

    AssignmentsEmail.send(ctx.first_assignee)

    refute_email_sent()
  end

  test "work-summary subjects, badges and bodies use the recipient language", ctx do
    {:ok, _} = Operately.People.update_person(ctx.first_assignee, %{language: "pt-BR"})
    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    previous_locale = Gettext.get_locale(OperatelyWeb.Gettext)

    flush_emails()
    OperatelyEmail.Cron.Assignments.send_assignments()
    emails = collect_emails()
    assert Enum.any?(emails, fn email ->
      email.to == [{"", ctx.first_assignee.email}] and
        email.subject == "#{ctx.company.name}: Seu trabalho para hoje" and
        email.html_body =~ "Data de conclusão: amanhã" and email.text_body =~ "Data de conclusão: amanhã" and
        email.text_body =~ "Shared urgent task" and email.text_body =~ "Espaço: Product"
    end)
    assert Enum.any?(emails, fn email ->
      email.to == [{"", ctx.second_assignee.email}] and email.subject == "#{ctx.company.name}: Your work for today" and
        email.html_body =~ "Due tomorrow" and email.text_body =~ "Shared urgent task"
    end)
    assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale

    {:ok, _} = Operately.Companies.disable_experimental_feature(company, "i18n")
    flush_emails()
    OperatelyEmail.Cron.Assignments.send_assignments()
    emails = collect_emails()
    assert Enum.any?(emails, fn email ->
      email.to == [{"", ctx.first_assignee.email}] and email.subject == "#{ctx.company.name}: Your work for today" and
        email.text_body =~ "Due tomorrow"
    end)
    assert Operately.People.get_person!(ctx.first_assignee.id).language == "pt-BR"
    assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale
  end

  test "email-only action labels translate without translating task names or reordering work", ctx do
    alias Operately.Assignments.Assignment
    origin = %Assignment.Origin{id: ctx.project.id, name: "Project <literal>", type: :project, path: "/project", space_name: "Space <literal>"}
    definitions = [
      {:check_in, :owner, "Submit weekly check-in", "Enviar check-in semanal"},
      {:check_in, :reviewer, "Review weekly check-in", "Revisar check-in semanal"},
      {:goal_update, :owner, "Submit goal progress update", "Enviar atualização de progresso do objetivo"},
      {:goal_update, :reviewer, "Review goal progress update", "Revisar atualização de progresso do objetivo"},
      {:project_retrospective, :reviewer, "Review project retrospective", "Revisar retrospectiva do projeto"},
      {:goal_retrospective, :reviewer, "Review goal retrospective", "Revisar retrospectiva do objetivo"},
      {:kpi_update, :owner, "Log update for KPI <literal>", "Registrar atualização de KPI <literal>"},
      {:project_task, :owner, "Submit weekly check-in", "Submit weekly check-in"}
    ]
    assignments = Enum.with_index(definitions, fn {type, role, label, _}, index ->
      %Assignment{resource_id: Ecto.UUID.generate(), type: type, role: role, action_label: label,
        name: if(type == :kpi_update, do: "KPI <literal>", else: label), due: Date.utc_today(), path: "/assignment/#{index}", origin: origin}
    end)

    with_mock Operately.Assignments.Loader, [:passthrough], load: fn _, _ -> assignments end do
      for locale <- ["en", "pt_BR", "fr"] do
        flush_emails()
        Gettext.with_locale(OperatelyWeb.Gettext, locale, fn -> AssignmentsEmail.send(ctx.first_assignee) end)
        assert_email_sent(fn email ->
          for {_, _, english, portuguese} <- definitions do
            assert email.text_body =~ if(locale == "pt_BR", do: portuguese, else: english)
          end
          assert email.html_body =~ "Project &lt;literal&gt;"
          assert email.text_body =~ "Project <literal>"
          refute email.html_body =~ "<literal>"
          expected_order = assignments |> Enum.sort_by(&String.downcase(&1.action_label)) |> Enum.map(& &1.path)
          actual_order = Regex.scan(~r{/assignment/\d+}, email.text_body) |> List.flatten()
          assert actual_order == expected_order
          true
        end)
      end
    end
  end

  test "work-summary due dates use singular and plural Portuguese copy with English fallback", ctx do
    for {days, english, portuguese} <- [
          {-1, "Overdue by 1 day", "Atrasado em 1 dia"},
          {-3, "Overdue by 3 days", "Atrasado em 3 dias"},
          {0, "Due today", "Data de conclusão: hoje"},
          {1, "Due tomorrow", "Data de conclusão: amanhã"},
          {3, "Due in 3 days", "Data de conclusão em 3 dias"},
          {nil, "No due date", "Sem data de conclusão"}
        ] do
      due_date = if days, do: Date.utc_today() |> Date.add(days) |> ContextualDate.create_day_date() |> Map.from_struct()
      {:ok, _} = Operately.Tasks.update_task(Repo.reload!(ctx.task), %{due_date: due_date, reminders: [%{type: :on_date, date: Date.utc_today()}]})
      for {locale, expected} <- [{"en", english}, {"pt_BR", portuguese}, {"fr", english}] do
        flush_emails()
        Gettext.with_locale(OperatelyWeb.Gettext, locale, fn -> AssignmentsEmail.send(ctx.first_assignee) end)
        assert_email_sent(fn email ->
          assert email.html_body =~ expected
          assert email.text_body =~ expected
          assert email.text_body =~ "Shared urgent task"
          assert email.text_body =~ if(locale == "pt_BR", do: "Lembrete para hoje", else: "Reminder for today")
          true
        end)
      end
    end
  end

  defp collect_emails do
    receive do
      {:email, email} -> [email | collect_emails()]
      {:emails, emails} -> emails ++ collect_emails()
    after
      0 -> []
    end
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
