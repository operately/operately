defmodule OperatelyEmail.Emails.AssignmentsEmail do
  import OperatelyEmail.Mailers.NotificationMailer

  alias Operately.Assignments.{Loader, LoaderV2}
  alias Operately.Assignments.LoaderV2.Assignment, as: AssignmentV2
  alias Operately.Companies
  alias Operately.Repo
  alias OperatelyWeb.Paths

  require Logger

  @due_soon_window_in_days 1
  @far_future_tuple {9999, 12, 31}
  @due_status_rank %{overdue: 0, due_today: 1, due_soon: 2, upcoming: 3, none: 4}

  #
  # Sending out an email to remind people of their assignments.
  # The scheduler of this email is located in OperatelyEmail.Assignments.Cron
  #

  def send(person) do
    company = Repo.preload(person, [:company]).company

    case load_assignments_payload(person, company) do
      {:ok, %{template: template, assigns: assigns}} ->
        email =
          company
          |> new()
          |> from("Operately")
          |> to(person)
          |> subject("#{company.name}: Your assignments for today")
          |> assign(:company, company)

        email =
          Enum.reduce(assigns, email, fn {key, value}, acc ->
            assign(acc, key, value)
          end)

        render(email, template)

      :no_assignments ->
        Logger.info("No assignments for #{person.full_name}")
    end
  end

  defp load_assignments_payload(_person, nil), do: :no_assignments

  defp load_assignments_payload(person, company) do
    if Companies.has_experimental_feature?(company, "review_v2") do
      v2_payload(person, company)
    else
      v1_payload(person, company)
    end
  end

  defp v1_payload(person, company) do
    assignments = Loader.load(person, company)

    if assignments == [] do
      :no_assignments
    else
      {:ok,
       %{
         template: "assignments",
         assigns: %{assignments: assignments}
       }}
    end
  end

  defp v2_payload(person, company) do
    assignments = LoaderV2.load(person, company)

    if assignments == [] do
      :no_assignments
    else
      categorized = categorize_assignments(assignments)

      if Enum.empty?(categorized.urgent_groups) do
        :no_assignments
      else
        {:ok,
         %{
           template: "assignments_v2",
           assigns: %{
             urgent_groups: categorized.urgent_groups
           }
         }}
      end
    end
  end

  defp categorize_assignments(assignments) do
    enriched =
      assignments
      |> Enum.map(&enrich_assignment/1)
      |> Enum.map(&assign_category/1)

    due_soon_assignments = Enum.filter(enriched, &(&1.category == :due_soon))
    review_assignments = Enum.filter(enriched, &(&1.category == :needs_review))
    urgent_assignments = due_soon_assignments ++ review_assignments

    urgent_groups = group_assignments_by_origin(urgent_assignments)

    %{
      urgent_groups: urgent_groups
    }
  end

  defp enrich_assignment(%AssignmentV2{} = assignment) do
    due_date = normalize_due_date(assignment.due)
    {due_status, due_status_label} = resolve_due_status(due_date)

    assignment
    |> Map.from_struct()
    |> Map.put(:origin, format_origin(assignment.origin))
    |> Map.put(:due_date, due_date)
    |> Map.put(:due_status, due_status)
    |> Map.put(:due_status_label, due_status_label)
    |> Map.put(:display_label, assignment.action_label || assignment.name)
    |> Map.put(:badge_label, due_status_label)
    |> Map.put(:url, Paths.to_url(assignment.path))
  end

  defp assign_category(assignment) do
    category =
      cond do
        assignment.role == :reviewer -> :needs_review
        due_soon?(assignment.due_status) -> :due_soon
        upcoming?(assignment.due_status) -> :upcoming
        true -> :none
      end

    assignment
    |> Map.put(:category, category)
    |> Map.put(:badge_label, assignment.due_status_label)
  end

  defp group_assignments_by_origin([]), do: []

  defp group_assignments_by_origin(assignments) do
    assignments
    |> Enum.group_by(fn assignment ->
      "#{assignment.origin.type}:#{assignment.origin.id}"
    end)
    |> Enum.map(fn {_key, grouped} ->
      sorted_assignments = Enum.sort_by(grouped, &assignment_sort_key/1)
      first = List.first(sorted_assignments)

      %{
        origin: first.origin,
        assignments: sorted_assignments
      }
    end)
    |> Enum.sort_by(&group_sort_key/1)
  end

  defp normalize_due_date(%Date{} = date), do: date
  defp normalize_due_date(%DateTime{} = datetime), do: DateTime.to_date(datetime)
  defp normalize_due_date(%NaiveDateTime{} = datetime), do: NaiveDateTime.to_date(datetime)
  defp normalize_due_date(_), do: nil

  defp format_origin(origin) do
    origin
    |> Map.from_struct()
    |> Map.put(:url, Paths.to_url(origin.path))
  end

  defp assignment_sort_key(assignment) do
    due_tuple =
      case assignment.due_date do
        nil -> @far_future_tuple
        %Date{} = date -> Date.to_erl(date)
      end

    {
      rank(assignment.due_status),
      due_tuple,
      String.downcase(assignment.display_label || "")
    }
  end

  defp group_sort_key(%{assignments: []}) do
    {{rank(:none), @far_future_tuple, ""}, ""}
  end

  defp group_sort_key(%{assignments: [first | _], origin: origin}) do
    {assignment_sort_key(first), String.downcase(origin.name || "")}
  end

  defp resolve_due_status(nil), do: {:none, "No due date"}

  defp resolve_due_status(%Date{} = due_date) do
    today = Date.utc_today()
    diff = Date.diff(due_date, today)

    cond do
      diff < 0 ->
        days = abs(diff)
        label = if days == 1, do: "Overdue by 1 day", else: "Overdue by #{days} days"
        {:overdue, label}

      diff == 0 ->
        {:due_today, "Due today"}

      diff == 1 ->
        {:due_soon, "Due tomorrow"}

      diff <= @due_soon_window_in_days ->
        {:due_soon, "Due in #{diff} days"}

      true ->
        {:upcoming, "Due in #{diff} days"}
    end
  end

  defp due_soon?(:overdue), do: true
  defp due_soon?(:due_today), do: true
  defp due_soon?(:due_soon), do: true
  defp due_soon?(_), do: false

  defp upcoming?(:upcoming), do: true
  defp upcoming?(:none), do: true
  defp upcoming?(_), do: false

  defp rank(status), do: Map.fetch!(@due_status_rank, status)
end
