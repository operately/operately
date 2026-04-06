defmodule OperatelyEmail.Mailers.DigestMailerTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias OperatelyEmail.Mailers.DigestMailer

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})

    {:ok, batch} =
      Operately.Notifications.create_email_batch(%{
        person_id: person.id,
        status: :scheduled,
        window_minutes: 5,
        window_started_at: ~N[2026-04-02 10:00:00],
        send_at: ~N[2026-04-02 10:05:00]
      })

    {:ok, company: company, person: person, batch: batch}
  end

  test "sends digest email successfully", ctx do
    digest_items = [
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 1",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-1",
        actor_name: "John D.",
        occurred_at: ~N[2026-04-02 10:01:00],
        coalesce_key: nil
      }
    ]

    assert {:ok, _} = DigestMailer.send(ctx.person, ctx.batch, digest_items)
  end

  test "groups digest items by parent resource", ctx do
    digest_items = [
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 1",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-1",
        actor_name: "John D.",
        occurred_at: ~N[2026-04-02 10:01:00],
        coalesce_key: nil
      },
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 2",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-2",
        actor_name: "Jane D.",
        occurred_at: ~N[2026-04-02 10:02:00],
        coalesce_key: nil
      },
      %{
        parent_id: "project-1",
        parent_type: :project,
        parent_name: "Project Alpha",
        headline: "Activity 3",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/project-1/activity-3",
        actor_name: "Bob D.",
        occurred_at: ~N[2026-04-02 10:03:00],
        coalesce_key: nil
      }
    ]

    email = DigestMailer.build_digest_email(ctx.person, ctx.batch, digest_items)

    assert email.html_body =~ "Goal 1"
    assert email.html_body =~ "Project Alpha"
    assert email.html_body =~ "Activity 1"
    assert email.html_body =~ "Activity 2"
    assert email.html_body =~ "Activity 3"
  end

  test "orders items chronologically within parent groups", ctx do
    digest_items = [
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 2",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-2",
        actor_name: "Jane D.",
        occurred_at: ~N[2026-04-02 10:02:00],
        coalesce_key: nil
      },
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 1",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-1",
        actor_name: "John D.",
        occurred_at: ~N[2026-04-02 10:01:00],
        coalesce_key: nil
      }
    ]

    email = DigestMailer.build_digest_email(ctx.person, ctx.batch, digest_items)

    activity_1_pos = :binary.match(email.html_body, "Activity 1") |> elem(0)
    activity_2_pos = :binary.match(email.html_body, "Activity 2") |> elem(0)

    assert activity_1_pos < activity_2_pos, "Activity 1 should appear before Activity 2 (chronological order)"
  end

  test "orders parent groups by earliest activity time", ctx do
    digest_items = [
      %{
        parent_id: "project-1",
        parent_type: :project,
        parent_name: "Project Alpha",
        headline: "Activity 3",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/project-1/activity-3",
        actor_name: "Bob D.",
        occurred_at: ~N[2026-04-02 10:03:00],
        coalesce_key: nil
      },
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 1",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-1",
        actor_name: "John D.",
        occurred_at: ~N[2026-04-02 10:01:00],
        coalesce_key: nil
      }
    ]

    email = DigestMailer.build_digest_email(ctx.person, ctx.batch, digest_items)

    goal_pos = :binary.match(email.html_body, "Goal 1") |> elem(0)
    project_pos = :binary.match(email.html_body, "Project Alpha") |> elem(0)

    assert goal_pos < project_pos, "Goal 1 should appear before Project Alpha (earliest activity first)"
  end
end
