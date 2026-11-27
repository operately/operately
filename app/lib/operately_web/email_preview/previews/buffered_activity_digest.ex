defmodule OperatelyWeb.EmailPreview.Previews.BufferedActivityDigest do
  @moduledoc "Mock data for the buffered activity digest email preview."

  alias OperatelyEmail.Mailers.DigestMailer
  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  @settings_url "#"

  def zero_state do
    build_preview([])
  end

  def couple_items do
    build_preview(couple_item_digest_items())
  end

  def multiple_items do
    build_preview(multiple_item_digest_items())
  end

  def mixed_grouped_and_individual do
    build_preview(mixed_digest_items())
  end

  def preview do
    multiple_items()
  end

  defp build_preview(digest_items) do
    {company, person} = base_context()

    assigns = DigestMailer.digest_assigns(digest_items, @settings_url)

    email =
      company
      |> Mailer.new()
      |> Mailer.from("Operately")
      |> Mailer.to(person)
      |> Mailer.subject(assigns.subject)

    email = %{email | assigns: assigns}

    Preview.build(email, "buffered_activity_digest")
  end

  defp base_context do
    company = %{name: "Acme Corporation"}
    person = %{full_name: "Jordan Smith", email: "jordan@localhost.com"}

    {company, person}
  end

  defp couple_item_digest_items do
    [
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "submitted a project check-in",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/projects/launch-website/check-ins/weekly-health-check",
        actor_name: "Alex M.",
        occurred_at: ~N[2026-04-08 10:02:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "commented on the launch checklist",
        excerpt_html: "<p>QA sign-off is in, but we still need the final support handoff.</p>",
        excerpt_text: "QA sign-off is in, but we still need the final support handoff.",
        item_url: "https://app.operately.dev/projects/launch-website/tasks/launch-checklist",
        actor_name: "Taylor R.",
        occurred_at: ~N[2026-04-08 10:07:00]
      })
    ]
  end

  defp mixed_digest_items do
    [
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "set the champion to Adriano",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/projects/launch-website",
        actor_name: "Adriano",
        occurred_at: ~N[2026-04-08 10:00:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "added a milestone",
        excerpt_html: "<p>Beta Launch - April 15th</p>",
        excerpt_text: "Beta Launch - April 15th",
        item_url: "https://app.operately.dev/projects/launch-website/milestones/beta-launch",
        actor_name: "Adriano",
        occurred_at: ~N[2026-04-08 10:02:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "set the due date to 15th April",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/projects/launch-website",
        actor_name: "Adriano",
        occurred_at: ~N[2026-04-08 10:05:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "commented on the launch checklist",
        excerpt_html: "<p>QA sign-off is in, but we still need the final support handoff.</p>",
        excerpt_text: "QA sign-off is in, but we still need the final support handoff.",
        item_url: "https://app.operately.dev/projects/launch-website/tasks/launch-checklist",
        actor_name: "Taylor R.",
        occurred_at: ~N[2026-04-08 10:07:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "updated the project champion",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/projects/launch-website",
        actor_name: "Jordan S.",
        occurred_at: ~N[2026-04-08 10:11:00]
      }),
      digest_item(%{
        parent_id: "goal-002",
        parent_type: :goal,
        parent_name: "Q2 Growth Plan",
        headline: "updated the goal reviewer",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/goals/q2-growth-plan",
        actor_name: "Morgan L.",
        occurred_at: ~N[2026-04-08 10:10:00]
      }),
      digest_item(%{
        parent_id: "goal-002",
        parent_type: :goal,
        parent_name: "Q2 Growth Plan",
        headline: "updated the goal champion",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/goals/q2-growth-plan",
        actor_name: "Morgan L.",
        occurred_at: ~N[2026-04-08 10:12:00]
      }),
      digest_item(%{
        parent_id: "goal-002",
        parent_type: :goal,
        parent_name: "Q2 Growth Plan",
        headline: "commented on the goal timeframe change",
        excerpt_html: "<p>The revised target looks solid, but we should still validate the assumptions with finance.</p>",
        excerpt_text: "The revised target looks solid, but we should still validate the assumptions with finance.",
        item_url: "https://app.operately.dev/goals/q2-growth-plan/activities/timeframe-change",
        actor_name: "Casey P.",
        occurred_at: ~N[2026-04-08 10:15:00]
      })
    ]
  end

  defp multiple_item_digest_items do
    [
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "submitted a project check-in",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/projects/launch-website/check-ins/weekly-health-check",
        actor_name: "Alex M.",
        occurred_at: ~N[2026-04-08 10:02:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "commented on the launch checklist",
        excerpt_html: "<p>QA sign-off is in, but we still need the final support handoff.</p>",
        excerpt_text: "QA sign-off is in, but we still need the final support handoff.",
        item_url: "https://app.operately.dev/projects/launch-website/tasks/launch-checklist",
        actor_name: "Taylor R.",
        occurred_at: ~N[2026-04-08 10:07:00]
      }),
      digest_item(%{
        parent_id: "goal-002",
        parent_type: :goal,
        parent_name: "Q2 Growth Plan",
        headline: "updated the goal reviewer",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/goals/q2-growth-plan",
        actor_name: "Morgan L.",
        occurred_at: ~N[2026-04-08 10:10:00]
      }),
      digest_item(%{
        parent_id: "project-001",
        parent_type: :project,
        parent_name: "Launch Website Project",
        headline: "updated the project champion",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://app.operately.dev/projects/launch-website",
        actor_name: "Jordan S.",
        occurred_at: ~N[2026-04-08 10:11:00]
      }),
      digest_item(%{
        parent_id: "goal-002",
        parent_type: :goal,
        parent_name: "Q2 Growth Plan",
        headline: "commented on the goal timeframe change",
        excerpt_html: "<p>The revised target looks solid, but we should still validate the assumptions with finance.</p>",
        excerpt_text: "The revised target looks solid, but we should still validate the assumptions with finance.",
        item_url: "https://app.operately.dev/goals/q2-growth-plan/activities/timeframe-change",
        actor_name: "Casey P.",
        occurred_at: ~N[2026-04-08 10:12:00]
      }),
      digest_item(%{
        parent_id: "space-003",
        parent_type: :space,
        parent_name: "Marketing Team",
        headline: "posted: launch readiness notes",
        excerpt_html: "<p>Support coverage and rollout timing have both been confirmed.</p>",
        excerpt_text: "Support coverage and rollout timing have both been confirmed.",
        item_url: "https://app.operately.dev/spaces/marketing-team/discussions/launch-readiness-notes",
        actor_name: "Alex M.",
        occurred_at: ~N[2026-04-08 10:14:00]
      })
    ]
  end

  defp digest_item(attrs) do
    attrs
    |> Map.put_new(:parent_url, parent_url(attrs))
    |> Map.put(:coalesce_key, nil)
  end

  defp parent_url(%{parent_type: :project, parent_id: "project-001"}), do: "https://app.operately.dev/projects/launch-website"
  defp parent_url(%{parent_type: :goal, parent_id: "goal-002"}), do: "https://app.operately.dev/goals/q2-growth-plan"
  defp parent_url(%{parent_type: :space, parent_id: "space-003"}), do: "https://app.operately.dev/spaces/marketing-team"
  defp parent_url(_), do: nil
end
