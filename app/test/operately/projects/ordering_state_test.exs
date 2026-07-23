defmodule Operately.Projects.OrderingStateTest do
  use Operately.DataCase, async: true

  alias Operately.ContextualDates.{ContextualDate, Timeframe}
  alias Operately.Projects.{Milestone, OrderingState}
  alias OperatelyWeb.Paths

  describe "ordered/2" do
    test "with empty ordering sorts by deadline then title, ignoring status" do
      # Days-of-month intentionally conflict with chronology so term-order Date bugs surface
      # (e.g. Aug 2 before Jul 20 under struct term ordering).
      early_done = milestone("Zebra", ~D[2026-07-20], :done)
      late_pending = milestone("Alpha", ~D[2026-09-15], :pending)
      mid_pending = milestone("Beta", ~D[2026-08-02], :pending)

      ordered =
        OrderingState.ordered([], [late_pending, early_done, mid_pending])
        |> Enum.map(& &1.title)

      assert ordered == ["Zebra", "Beta", "Alpha"]
    end

    test "with empty ordering puts undated milestones after dated ones and sorts undated by title" do
      dated = milestone("Late", ~D[2026-08-01], :pending)
      undated_b = milestone("Bravo", nil, :pending)
      undated_a = milestone("Alpha", nil, :done)

      ordered =
        OrderingState.ordered([], [undated_b, dated, undated_a])
        |> Enum.map(& &1.title)

      assert ordered == ["Late", "Alpha", "Bravo"]
    end

    test "with empty ordering sorts chronologically when day-of-month would mislead term order" do
      aug_second = milestone("Global", ~D[2026-08-02], :done)
      jul_seventh = milestone("EU", ~D[2026-07-07], :done)
      aug_fifteenth = milestone("Localized", ~D[2026-08-15], :pending)
      jul_twentieth = milestone("Product", ~D[2026-07-20], :done)

      ordered =
        OrderingState.ordered([], [aug_second, jul_seventh, aug_fifteenth, jul_twentieth])
        |> Enum.map(& &1.title)

      assert ordered == ["EU", "Product", "Global", "Localized"]
    end

    test "with empty ordering breaks deadline ties by title" do
      same_day_b = milestone("Beta", ~D[2026-08-01], :pending)
      same_day_a = milestone("Alpha", ~D[2026-08-01], :done)

      ordered =
        OrderingState.ordered([], [same_day_b, same_day_a])
        |> Enum.map(& &1.title)

      assert ordered == ["Alpha", "Beta"]
    end

    test "non-empty ordering state wins over deadline fallback" do
      early = milestone("Early", ~D[2026-07-01], :pending)
      late = milestone("Late", ~D[2026-09-01], :pending)
      mid = milestone("Mid", ~D[2026-08-01], :done)

      ordering = [Paths.milestone_id(late), Paths.milestone_id(early), Paths.milestone_id(mid)]

      ordered =
        OrderingState.ordered(ordering, [early, late, mid])
        |> Enum.map(& &1.title)

      assert ordered == ["Late", "Early", "Mid"]
    end

    test "milestones missing from ordering are appended by deadline then title" do
      early = milestone("Early", ~D[2026-07-01], :pending)
      late = milestone("Late", ~D[2026-09-01], :pending)
      mid = milestone("Mid", ~D[2026-08-01], :done)

      ordering = [Paths.milestone_id(late)]

      ordered =
        OrderingState.ordered(ordering, [mid, early, late])
        |> Enum.map(& &1.title)

      assert ordered == ["Late", "Early", "Mid"]
    end
  end

  defp milestone(title, deadline, status) do
    timeframe =
      if deadline do
        %Timeframe{
          contextual_end_date: ContextualDate.create_day_date(deadline)
        }
      else
        nil
      end

    %Milestone{
      id: Ecto.UUID.generate(),
      title: title,
      status: status,
      timeframe: timeframe
    }
  end
end
