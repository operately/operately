defmodule Operately.Tasks.ReminderTest do
  use ExUnit.Case, async: true

  alias Operately.Tasks.Reminder

  @today ~D[2026-06-02]
  @tomorrow ~D[2026-06-03]
  @in_three_days ~D[2026-06-05]
  @yesterday ~D[2026-06-01]

  describe "due_today?/3" do
    test "matches before-due reminders by the configured number of days" do
      reminders = [%Reminder{type: :before_due, days: 3}]

      assert Reminder.due_today?(@in_three_days, reminders, @today)
      refute Reminder.due_today?(@tomorrow, reminders, @today)
    end

    test "matches due-day reminders on the due date" do
      reminders = [%Reminder{type: :due_day}]

      assert Reminder.due_today?(@today, reminders, @today)
      refute Reminder.due_today?(@tomorrow, reminders, @today)
    end

    test "matches overdue reminders after the due date" do
      reminders = [%Reminder{type: :overdue}]

      assert Reminder.due_today?(@yesterday, reminders, @today)
      refute Reminder.due_today?(@today, reminders, @today)
    end

    test "matches on-date reminders without a task due date" do
      reminders = [%Reminder{type: :on_date, date: @today}]

      assert Reminder.due_today?(nil, reminders, @today)
      refute Reminder.due_today?(nil, [%Reminder{type: :on_date, date: @tomorrow}], @today)
    end

    test "matches when any reminder is due today" do
      reminders = [
        %Reminder{type: :before_due, days: 7},
        %Reminder{type: :due_day}
      ]

      assert Reminder.due_today?(@today, reminders, @today)
    end

    test "does not match due-relative reminders without a due date" do
      reminders = [
        %Reminder{type: :before_due, days: 1},
        %Reminder{type: :due_day},
        %Reminder{type: :overdue}
      ]

      refute Reminder.due_today?(nil, reminders, @today)
    end

    test "does not match missing reminders" do
      refute Reminder.due_today?(@tomorrow, nil, @today)
      refute Reminder.due_today?(@tomorrow, [], @today)
    end
  end
end
