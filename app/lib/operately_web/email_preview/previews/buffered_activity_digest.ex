defmodule OperatelyWeb.EmailPreview.Previews.BufferedActivityDigest do
  @moduledoc "Mock data for the buffered activity digest email preview."

  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  @notifications_url "https://app.operately.dev/acme-corp/notifications"
  @window_minutes 15
  @subject "Updates from the last #{@window_minutes} minutes"

  def zero_state do
    build_preview([])
  end

  def couple_items do
    build_preview(couple_item_digest_items())
  end

  def multiple_items do
    build_preview(multiple_item_digest_items())
  end

  def preview do
    multiple_items()
  end

  defp build_preview(digest_items) do
    {company, person} = base_context()

    email =
      company
      |> Mailer.new()
      |> Mailer.from("Operately")
      |> Mailer.to(person)
      |> Mailer.subject(@subject)
      |> Mailer.assign(:window_minutes, @window_minutes)
      |> Mailer.assign(:parent_groups, group_by_parent(digest_items))
      |> Mailer.assign(:notifications_url, @notifications_url)

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
    Map.put(attrs, :coalesce_key, nil)
  end

  defp group_by_parent(digest_items) do
    digest_items
    |> Enum.group_by(fn item -> {item.parent_type, item.parent_id} end)
    |> Enum.map(fn {{_parent_type, _parent_id}, items} ->
      sorted_items = Enum.sort_by(items, & &1.occurred_at, &NaiveDateTime.before?/2)

      %{
        parent_name: hd(items).parent_name,
        items: sorted_items
      }
    end)
    |> Enum.sort_by(fn group ->
      hd(group.items).occurred_at
    end, &NaiveDateTime.before?/2)
  end
end
