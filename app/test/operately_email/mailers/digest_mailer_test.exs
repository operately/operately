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

  for {parent_type, label} <- [project: "Project", space: "Space", goal: "Goal"] do
    test "preserves the English #{label} label in buffered and daily digests", ctx do
      items = [
        %{
          parent_id: "parent-1",
          parent_type: unquote(parent_type),
          parent_name: "User-authored name",
          headline: "created the task \"Call leads\"",
          excerpt_html: nil,
          excerpt_text: nil,
          item_url: "https://example.com/task-1",
          actor_name: "John D.",
          occurred_at: ~N[2026-04-02 10:01:00],
          coalesce_key: nil
        }
      ]

      for email <- [DigestMailer.build_digest_email(ctx.person, ctx.batch, items), DigestMailer.build_daily_summary_email(ctx.person, items)] do
        assert email.html_body =~ ~r/>\s*#{unquote(label)}\s*</
        assert email.html_body =~ "User-authored name"
        assert email.text_body =~ "User-authored name (1 update)"
      end
    end
  end

  test "links parent group title when parent url is available", ctx do
    digest_items = [
      %{
        parent_id: "project-1",
        parent_type: :project,
        parent_name: "Project Alpha",
        parent_url: "https://example.com/project-1",
        headline: "Activity 1",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/project-1/activity-1",
        actor_name: "John D.",
        occurred_at: ~N[2026-04-02 10:01:00],
        coalesce_key: nil
      }
    ]

    email = DigestMailer.build_digest_email(ctx.person, ctx.batch, digest_items)

    assert email.html_body =~ ~s(<a href="https://example.com/project-1")
    assert email.text_body =~ "https://example.com/project-1"
  end

  test "renders parent group title without a link when parent url is unavailable", ctx do
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

    email = DigestMailer.build_digest_email(ctx.person, ctx.batch, digest_items)

    assert email.html_body =~ "Goal 1"
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

  test "uses singular English copy for one update", ctx do
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

    email = DigestMailer.build_digest_email(ctx.person, ctx.batch, digest_items)

    assert email.subject == "You have 1 new update"
    assert email.html_body =~ "You have 1 new update"
    assert email.html_body =~ "View update"
    assert email.text_body =~ "You have 1 new update"
    assert email.text_body =~ "Goal 1 (1 update)"
  end

  test "keeps English digest copy when i18n is disabled for a pt-BR recipient", ctx do
    {:ok, person} = Operately.People.update_person(ctx.person, %{language: "pt-BR"})
    person = %{person | company: ctx.company}

    digest_items = [
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "created the task \"Call leads\"",
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
        headline: "created the task \"Follow up\"",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-2",
        actor_name: "Jane D.",
        occurred_at: ~N[2026-04-02 10:02:00],
        coalesce_key: nil
      }
    ]

    email =
      Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
        DigestMailer.build_digest_email(person, ctx.batch, digest_items)
      end)

    assert email.subject == "You have 2 new updates"
    assert email.html_body =~ "Manage email settings"
    assert email.text_body =~ "Goal 1 (2 updates)"
  end

  test "renders Portuguese digest copy when i18n is enabled for a pt-BR recipient", ctx do
    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    {:ok, person} = Operately.People.update_person(ctx.person, %{language: "pt-BR"})
    person = %{person | company: company}

    digest_items = [
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "criou a tarefa \"Call leads\"",
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
        headline: "criou a tarefa \"Follow up\"",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/goal-1/activity-2",
        actor_name: "Jane D.",
        occurred_at: ~N[2026-04-02 10:02:00],
        coalesce_key: nil
      }
    ]

    email =
      Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
        DigestMailer.build_digest_email(person, ctx.batch, digest_items)
      end)

    assert email.subject == "Você tem 2 novas atualizações"
    assert email.html_body =~ "Você tem 2 novas atualizações"
    assert email.html_body =~ "Objetivo"
    assert email.html_body =~ "Gerenciar configurações de e-mail"
    assert email.html_body =~ "Ver atualização"
    assert email.text_body =~ "Você tem 2 novas atualizações"
    assert email.text_body =~ "Goal 1 (2 atualizações)"
  end

  test "builds daily summary digest email with the same grouped rendering", ctx do
    digest_items = [
      %{
        parent_id: "goal-1",
        parent_type: :goal,
        parent_name: "Goal 1",
        headline: "Activity 1",
        excerpt_html: "<p>Hello</p>",
        excerpt_text: "Hello",
        item_url: "https://example.com/goal-1/activity-1",
        actor_name: "John D.",
        occurred_at: ~N[2026-04-02 10:01:00],
        coalesce_key: nil
      },
      %{
        parent_id: "project-1",
        parent_type: :project,
        parent_name: "Project Alpha",
        headline: "Activity 2",
        excerpt_html: nil,
        excerpt_text: nil,
        item_url: "https://example.com/project-1/activity-2",
        actor_name: "Jane D.",
        occurred_at: ~N[2026-04-02 10:02:00],
        coalesce_key: nil
      }
    ]

    email = DigestMailer.build_daily_summary_email(ctx.person, digest_items)

    assert email.subject == "You have 2 new updates"
    assert email.html_body =~ "You have 2 new updates"
    assert email.html_body =~ "Goal 1"
    assert email.html_body =~ "Project Alpha"
    assert email.text_body =~ "You have 2 new updates"
  end
end
