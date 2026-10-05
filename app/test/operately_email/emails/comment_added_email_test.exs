defmodule OperatelyEmail.Emails.CommentAddedEmailTest do
  use Operately.DataCase

  import Swoosh.TestAssertions

  alias OperatelyEmail.Emails.CommentAddedEmail

  test "all supported comment contexts use complete localized subjects and headings" do
    author = %{full_name: "Ana Silva"}
    for {context, english, portuguese} <- [
          {{:goal_timeframe_editing, nil}, "commented on the goal timeframe change", "comentou na alteração do período do objetivo"},
          {{:goal_closing, nil}, "commented on the goal closing", "comentou no encerramento do objetivo"},
          {{:goal_reopening, nil}, "commented on the goal reopening", "comentou na reabertura do objetivo"},
          {{:project_resuming, nil}, "commented on the project resumption", "comentou na retomada do projeto"},
          {{:project_pausing, nil}, "commented on the project pausing", "comentou na pausa do projeto"},
          {{:discussion, "Title <literal>"}, "commented on: Title <literal>", "comentou em: Title <literal>"}
        ], {locale, expected} <- [{"en", english}, {"pt_BR", portuguese}, {"fr", english}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        assert CommentAddedEmail.subject_text(author, "Space <literal>", context) == "(Space <literal>) Ana S. #{expected}"
        assert CommentAddedEmail.heading(author, context) == "Ana S. #{expected}"
      end)
    end
  end

  test "goal and project discussion comments preserve context, content and destinations" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal_discussion(:goal_discussion, :goal, title: "Goal <literal>")
      |> Factory.add_project_discussion(:project_discussion, :project, title: "Project <literal>")

    for discussion <- [:goal_discussion, :project_discussion] do
      ctx = Factory.add_comment(ctx, :comment, discussion, content: Operately.Support.RichText.rich_text("Literal comment"))
      activity = Repo.one!(from a in Operately.Activities.Activity, where: a.action == "comment_added" and a.content["comment_id"] == ^ctx.comment.id)
      title = Map.fetch!(ctx, discussion).title
      link = CommentAddedEmail.get_link(ctx.company, activity, ctx.comment)

      for {locale, expected} <- [{"en", "commented on:"}, {"pt_BR", "comentou em:"}, {"fr", "commented on:"}] do
        flush_emails()
        Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
          CommentAddedEmail.send(ctx.creator, activity)
          assert CommentAddedEmail.buffered_item(ctx.creator, activity).headline == "commented on: #{title}"
        end)

        assert_email_sent(fn email ->
          assert email.subject =~ "#{expected} #{title}"
          assert email.text_body =~ "#{expected} #{title}"
          assert email.text_body =~ link
          assert email.html_body =~ "Literal comment"
          assert email.html_body =~ "&lt;literal&gt;"
          refute email.html_body =~ "<literal>"
          true
        end)
      end
    end
  end

  defp flush_emails do
    receive do
      {:email, _} -> flush_emails()
      {:emails, _} -> flush_emails()
    after
      0 -> :ok
    end
  end
end
