defmodule OperatelyEmail.ProjectPausingEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.CommentsFixtures
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyEmail.Emails.ProjectPausingEmail
  alias OperatelyWeb.Paths

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, name: "Paper Expansion")

    {:ok, ctx}
  end

  test "buffered item includes pause message excerpt", ctx do
    message = RichText.rich_text("Pausing for budget review")
    thread = comment_thread_fixture(%{parent_id: Ecto.UUID.generate(), message: message})

    activity =
      activity_fixture(%{
        author_id: ctx.creator.id,
        action: "project_pausing",
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.space.id,
          "project_id" => ctx.project.id
        },
        comment_thread_id: thread.id
      })

    item = ProjectPausingEmail.buffered_item(ctx.creator, activity)

    assert item.parent_id == ctx.project.id
    assert item.parent_type == :project
    assert item.parent_name == ctx.project.name
    assert item.headline == "paused the project"
    assert item.excerpt_text =~ "Pausing for budget review"
    assert item.item_url == Paths.project_path(ctx.company, ctx.project) |> Paths.to_url()
  end

  test "send renders pause message in email body", ctx do
    message = RichText.rich_text("Pausing for budget review")
    thread = comment_thread_fixture(%{parent_id: Ecto.UUID.generate(), message: message})

    activity =
      activity_fixture(%{
        author_id: ctx.creator.id,
        action: "project_pausing",
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.space.id,
          "project_id" => ctx.project.id
        },
        comment_thread_id: thread.id
      })
      |> Operately.Repo.preload([:author, :comment_thread])

    flush_emails()
    ProjectPausingEmail.send(ctx.creator, activity)

    assert_email_sent(fn email ->
      assert email.subject =~ "paused the project"
      assert email.subject =~ ctx.project.name
      assert email.html_body =~ "Pausing for budget review"
      true
    end)
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
