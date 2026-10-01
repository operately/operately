defmodule OperatelyEmail.Emails.GoalClosingEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Swoosh.TestAssertions

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias OperatelyEmail.Emails.GoalClosingEmail
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_owner(:owner)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_space_member(:reviewer, :space)
      |> Factory.add_space_member(:editor, :space)
      |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
      |> Factory.close_goal(:goal, author: :champion)

    {:ok, ctx}
  end

  test "renders Portuguese for enabled recipients and English when the flag is disabled", ctx do
    {:ok, person} = Operately.People.update_person(ctx.reviewer, %{language: "pt-BR"})
    {:ok, enabled_company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    previous_locale = Gettext.get_locale(OperatelyWeb.Gettext)

    for {company, portuguese?} <- [{enabled_company, true}, {ctx.company, false}] do
      person = %{person | company: company}

      Operately.I18n.EffectiveLanguage.with_locale(person, fn ->
        send_closing_email(ctx, person)
      end)

      assert_email_sent(fn email ->
        if portuguese? do
          assert email.subject =~ "encerrou"
          assert email.html_body =~ "Confirmar leitura"
          assert email.text_body =~ "encerrou"
        else
          refute email.subject =~ "encerrou"
          refute email.html_body =~ "Confirmar leitura"
        end
        refute email.html_body =~ "%{"
        refute email.text_body =~ "%{"
        true
      end)
      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale
    end
  end

  test "reviewer gets an Acknowledge CTA with the auto-ack URL", ctx do
    send_closing_email(ctx, ctx.reviewer)
    assert_acknowledge_email()
  end

  test "champion gets a View Retrospective CTA when they closed the goal", ctx do
    send_closing_email(ctx, ctx.champion)
    assert_view_retrospective_email()
  end

  test "champion gets an Acknowledge CTA when the reviewer closed the goal", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:reviewer_closed_goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
      |> Factory.close_goal(:reviewer_closed_goal, author: :reviewer)

    send_closing_email(ctx, ctx.champion, ctx.reviewer_closed_goal)
    assert_acknowledge_email()
  end

  test "reviewer and champion get an Acknowledge CTA when a third person closed the goal", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:editor_closed_goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
      |> Factory.close_goal(:editor_closed_goal, author: :editor)

    send_closing_email(ctx, ctx.reviewer, ctx.editor_closed_goal)
    assert_acknowledge_email()

    send_closing_email(ctx, ctx.champion, ctx.editor_closed_goal)
    assert_acknowledge_email()
  end

  test "company owner gets a View Retrospective CTA", ctx do
    send_closing_email(ctx, ctx.owner)
    assert_view_retrospective_email()
  end

  test "space member with edit access gets a View Retrospective CTA", ctx do
    send_closing_email(ctx, ctx.editor)
    assert_view_retrospective_email()
  end

  test "the worker delivers the same goal event in each recipient's language", ctx do
    {:ok, _company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    {:ok, portuguese} = Operately.People.update_person(ctx.reviewer, %{language: "pt-BR"})
    activity = latest_goal_closing(ctx.goal)
    previous_locale = Gettext.get_locale(OperatelyWeb.Gettext)
    flush_emails()

    for person <- [portuguese, ctx.owner] do
      notification = Operately.NotificationsFixtures.notification_fixture(
        activity_id: activity.id, person_id: person.id, email_sent: false, email_sent_at: nil
      )
      assert {:ok, :sent} = Operately.Notifications.EmailWorker.deliver(notification)
    end

    assert_email_sent(fn email ->
      Enum.any?(email.to, fn {_name, address} -> address == portuguese.email end) && String.contains?(email.subject, "encerrou o objetivo")
    end)
    assert_email_sent(fn email ->
      Enum.any?(email.to, fn {_name, address} -> address == ctx.owner.email end) && String.contains?(email.subject, "closed the")
    end)
    assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale
  end

  defp send_closing_email(ctx, person), do: send_closing_email(ctx, person, ctx.goal)

  defp send_closing_email(_ctx, person, goal) do
    flush_emails()
    GoalClosingEmail.send(person, latest_goal_closing(goal))
  end

  defp assert_acknowledge_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">Acknowledge</a>"
      assert email.html_body =~ "acknowledge=true"
      refute email.html_body =~ ">View Retrospective</a>"
      true
    end)
  end

  defp assert_view_retrospective_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">View Retrospective</a>"
      refute email.html_body =~ ">Acknowledge</a>"
      refute email.html_body =~ "acknowledge=true"
      true
    end)
  end

  defp latest_goal_closing(goal) do
    from(a in Activity,
      where: a.action == "goal_closing",
      where: a.content["goal_id"] == ^goal.id,
      order_by: [desc: a.inserted_at],
      limit: 1
    )
    |> Operately.Repo.one!()
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
