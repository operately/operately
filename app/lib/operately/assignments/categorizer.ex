defmodule Operately.Assignments.Categorizer do
  @moduledoc """
  Categorizes and groups assignments by urgency and role.

  Takes a flat list of assignments and returns a categorized structure with:
  - due_soon: Owner assignments that are overdue, due today, or due soon
  - needs_review: Reviewer assignments waiting for acknowledgment
  - upcoming: Owner assignments with future due dates

  Each category contains groups of assignments organized by their origin (project/goal/space).
  """

  defmodule AssignmentGroup do
    @enforce_keys [:origin, :assignments]
    defstruct [:origin, :assignments]
  end

  defmodule AssignmentCategory do
    @enforce_keys [:due_soon, :needs_review, :upcoming]
    defstruct [:due_soon, :needs_review, :upcoming]
  end

  @doc """
  Categorizes a list of fully-enriched assignments into due_soon, needs_review, and upcoming groups.

  Assignments must already have due_status metadata populated (done by Assignment.build/1 in LoaderV2).
  """
  def categorize(assignments) do
    owner_assignments = Enum.filter(assignments, &(&1.role == :owner))
    reviewer_assignments = Enum.filter(assignments, &(&1.role == :reviewer))

    due_soon_assignments = Enum.filter(owner_assignments, &is_due_soon?(&1.due_status))
    upcoming_assignments = Enum.filter(owner_assignments, &is_upcoming?(&1.due_status))

    %AssignmentCategory{
      due_soon: group_by_origin(due_soon_assignments),
      needs_review: group_by_origin(reviewer_assignments),
      upcoming: group_by_origin(upcoming_assignments)
    }
  end

  defp is_due_soon?(status) when status in [:overdue, :due_today, :due_soon], do: true
  defp is_due_soon?(_), do: false

  defp is_upcoming?(status) when status in [:upcoming, :none], do: true
  defp is_upcoming?(_), do: false

  defp group_by_origin(assignments) do
    assignments
    |> Enum.group_by(&origin_key/1)
    |> Enum.map(fn {_key, group_assignments} ->
      %AssignmentGroup{
        origin: hd(group_assignments).origin,
        assignments: Enum.sort(group_assignments, &compare_assignments/2)
      }
    end)
    |> Enum.sort(&compare_groups/2)
  end

  defp origin_key(assignment) do
    "#{assignment.origin.type}:#{assignment.origin.id}"
  end

  defp compare_assignments(a, b) do
    status_diff = due_status_rank(a.due_status) - due_status_rank(b.due_status)

    cond do
      status_diff != 0 -> status_diff < 0
      true -> compare_dates(a.due_date, b.due_date)
    end
  end

  defp compare_groups(a, b) do
    first_a = List.first(a.assignments)
    first_b = List.first(b.assignments)

    cond do
      is_nil(first_a) and is_nil(first_b) -> false
      is_nil(first_a) -> false
      is_nil(first_b) -> true
      true ->
        status_diff = due_status_rank(first_a.due_status) - due_status_rank(first_b.due_status)

        cond do
          status_diff != 0 -> status_diff < 0
          true ->
            date_cmp = compare_dates(first_a.due_date, first_b.due_date)
            if date_cmp, do: date_cmp, else: a.origin.name < b.origin.name
        end
    end
  end

  defp compare_dates(nil, nil), do: false
  defp compare_dates(nil, _), do: false
  defp compare_dates(_, nil), do: true
  defp compare_dates(a, b), do: Date.compare(a, b) == :lt

  defp due_status_rank(:overdue), do: 0
  defp due_status_rank(:due_today), do: 1
  defp due_status_rank(:due_soon), do: 2
  defp due_status_rank(:upcoming), do: 3
  defp due_status_rank(:none), do: 4
end
