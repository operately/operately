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
        due_date: ContextualDate.create_day_date(Date.utc_today())
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

  defp flush_emails do
    receive do
      {:email, _email} -> flush_emails()
      {:emails, _emails} -> flush_emails()
    after
      0 -> :ok
    end
  end
end
