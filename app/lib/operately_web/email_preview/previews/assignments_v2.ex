defmodule OperatelyWeb.EmailPreview.Previews.AssignmentsV2 do
  @moduledoc """
  Mock data for previewing the assignments v2 email template.
  """

  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  def simple do
    simple_groups()
    |> build_preview()
  end

  def complete do
    complete_groups()
    |> build_preview()
  end

  def single do
    single_group()
    |> build_preview()
  end

  defp build_preview(urgent_groups) do
    {company, person} = base_context()

    email =
      company
      |> Mailer.new()
      |> Mailer.from("Operately")
      |> Mailer.to(person)
      |> Mailer.subject("#{company.name}: Your assignments for today")
      |> Mailer.assign(:company, company)
      |> Mailer.assign(:urgent_groups, urgent_groups)

    Preview.build(email, "assignments_v2")
  end

  defp base_context do
    company = %{
      name: "Acme Corporation"
    }

    person = %{
      full_name: "John Kipson",
      email: "john@localhost.com"
    }

    {company, person}
  end

  defp single_group do
    [
      group(
        %{
          id: "proj-001",
          type: :project,
          name: "Launch Website Project",
          space_name: "Marketing Team",
          path: "/projects/launch-website",
          url: "https://app.operately.dev/projects/launch-website"
        },
        [
          %{
            display_label: "Submit weekly check-in",
            badge_label: "Due today",
            url: "https://app.operately.dev/projects/launch-website/check-ins/new",
            due_status: :due_today,
            category: :due_soon
          }
        ]
      )
    ]
  end

  defp simple_groups do
    [
      group(
        %{
          id: "proj-001",
          type: :project,
          name: "Launch Website Project",
          space_name: "Marketing Team",
          path: "/projects/launch-website",
          url: "https://app.operately.dev/projects/launch-website"
        },
        [
          %{
            display_label: "Submit weekly check-in",
            badge_label: "Due today",
            url: "https://app.operately.dev/projects/launch-website/check-ins/new",
            due_status: :due_today,
            category: :due_soon
          },
          %{
            display_label: "Finalize launch checklist",
            badge_label: "Due tomorrow",
            url: "https://app.operately.dev/projects/launch-website/tasks/finalize-launch-checklist",
            due_status: :due_soon,
            category: :due_soon
          },
          %{
            display_label: "QA sign-off",
            badge_label: "Overdue by 1 day",
            url: "https://app.operately.dev/projects/launch-website/tasks/qa-sign-off",
            due_status: :overdue,
            category: :due_soon
          }
        ]
      )
    ]
  end

  defp complete_groups do
    [
      group(
        %{
          id: "proj-001",
          type: :project,
          name: "Launch Website Project",
          space_name: "Marketing Team",
          path: "/projects/launch-website",
          url: "https://app.operately.dev/projects/launch-website"
        },
        [
          %{
            display_label: "Submit weekly check-in",
            badge_label: "Due today",
            url: "https://app.operately.dev/projects/launch-website/check-ins/new",
            due_status: :due_today,
            category: :due_soon
          },
          %{
            display_label: "Review homepage copy",
            badge_label: "Due tomorrow",
            url: "https://app.operately.dev/projects/launch-website/tasks/review-homepage-copy",
            due_status: :due_soon,
            category: :due_soon
          },
          %{
            display_label: "QA sign-off",
            badge_label: "Overdue by 1 day",
            url: "https://app.operately.dev/projects/launch-website/tasks/qa-sign-off",
            due_status: :overdue,
            category: :due_soon
          },
          %{
            display_label: "Approve launch announcement",
            badge_label: "Due tomorrow",
            url: "https://app.operately.dev/projects/launch-website/tasks/approve-launch-announcement",
            due_status: :due_soon,
            category: :needs_review,
            role: :reviewer
          }
        ]
      ),
      group(
        %{
          id: "goal-002",
          type: :goal,
          name: "Q2 Growth Plan",
          space_name: "Executive Team",
          path: "/goals/q2-growth-plan",
          url: "https://app.operately.dev/goals/q2-growth-plan"
        },
        [
          %{
            display_label: "Publish weekly growth update",
            badge_label: "Due today",
            url: "https://app.operately.dev/goals/q2-growth-plan/updates/new",
            due_status: :due_today,
            category: :due_soon
          },
          %{
            display_label: "Review revenue forecast",
            badge_label: "Due tomorrow",
            url: "https://app.operately.dev/goals/q2-growth-plan/updates/review-revenue-forecast",
            due_status: :due_soon,
            category: :needs_review,
            role: :reviewer
          },
          %{
            display_label: "Acknowledge finance update",
            badge_label: "Overdue by 2 days",
            url: "https://app.operately.dev/goals/q2-growth-plan/acknowledgements/finance-update",
            due_status: :overdue,
            category: :due_soon
          }
        ]
      ),
      group(
        %{
          id: "proj-003",
          type: :project,
          name: "Customer Onboarding Revamp",
          space_name: "Customer Success",
          path: "/projects/customer-onboarding-revamp",
          url: "https://app.operately.dev/projects/customer-onboarding-revamp"
        },
        [
          %{
            display_label: "Submit weekly check-in",
            badge_label: "Due today",
            url: "https://app.operately.dev/projects/customer-onboarding-revamp/check-ins/new",
            due_status: :due_today,
            category: :due_soon
          },
          %{
            display_label: "Prepare training outline",
            badge_label: "Overdue by 3 days",
            url: "https://app.operately.dev/projects/customer-onboarding-revamp/tasks/prepare-training-outline",
            due_status: :overdue,
            category: :due_soon
          },
          %{
            display_label: "Review onboarding survey",
            badge_label: "Due tomorrow",
            url: "https://app.operately.dev/projects/customer-onboarding-revamp/tasks/review-onboarding-survey",
            due_status: :due_soon,
            category: :needs_review,
            role: :reviewer
          }
        ]
      )
    ]
  end

  defp group(origin_attrs, assignments) do
    origin = origin(origin_attrs)

    %{
      origin: origin,
      assignments: Enum.map(assignments, &build_assignment(origin, &1))
    }
  end

  defp origin(attrs) do
    %{
      id: Map.fetch!(attrs, :id),
      name: Map.fetch!(attrs, :name),
      type: Map.fetch!(attrs, :type),
      path: Map.fetch!(attrs, :path),
      url: Map.fetch!(attrs, :url),
      space_name: Map.get(attrs, :space_name)
    }
  end

  defp build_assignment(origin, attrs) do
    badge_label = Map.fetch!(attrs, :badge_label)
    display_label = Map.fetch!(attrs, :display_label)

    base = %{
      origin: origin,
      display_label: display_label,
      badge_label: badge_label,
      url: Map.fetch!(attrs, :url),
      due_date: Map.get(attrs, :due_date),
      due_status: Map.get(attrs, :due_status, :due_soon),
      due_status_label: Map.get(attrs, :due_status_label, badge_label),
      category: Map.get(attrs, :category, :due_soon)
    }

    extras =
      attrs
      |> Map.drop([
        :display_label,
        :badge_label,
        :url,
        :due_date,
        :due_status,
        :due_status_label,
        :category
      ])

    Map.merge(base, extras)
  end
end
