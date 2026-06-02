defmodule OperatelyEmail.AssignmentsEmailTest do
  use Operately.DataCase

  import Swoosh.TestAssertions

  alias Operately.ContextualDates.ContextualDate
  alias Operately.Support.Factory
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
        email.subject == "#{ctx.company.name}: Your assignments for today" and
        email.html_body =~ "Shared urgent task"
    end)

    assert_email_sent(fn email ->
      email.to == [{"", ctx.second_assignee.email}] and
        email.subject == "#{ctx.company.name}: Your assignments for today" and
        email.html_body =~ "Shared urgent task"
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
        email.subject == "#{ctx.company.name}: Your assignments for today" and
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
        email.subject == "#{ctx.company.name}: Your assignments for today" and
        email.html_body =~ "Shared urgent task" and
        email.html_body =~ "Due tomorrow"
    end)
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
        email.html_body =~ "Due in 3 days"
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

  defp flush_emails do
    receive do
      {:email, _email} -> flush_emails()
      {:emails, _emails} -> flush_emails()
    after
      0 -> :ok
    end
  end
end
