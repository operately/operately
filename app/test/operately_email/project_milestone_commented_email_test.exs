defmodule OperatelyEmail.ProjectMilestoneCommentedEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [where: 3]
  import Operately.ActivitiesFixtures
  import Operately.CommentsFixtures
  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Swoosh.TestAssertions

  alias OperatelyEmail.Emails.ProjectMilestoneCommentedEmail

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id, full_name: "Michael Scott"})
    recipient = person_fixture_with_account(%{company_id: company.id, full_name: "Dwight Schrute"})
    group = group_fixture(author, %{company_id: company.id})

    project =
      project_fixture(%{
        company_id: company.id,
        creator_id: author.id,
        champion_id: author.id,
        reviewer_id: recipient.id,
        group_id: group.id,
        name: "Release Dunder Mifflin Infinity"
      })

    milestone = milestone_fixture(%{project_id: project.id, title: "Important Work"})

    {:ok, company: company, author: author, recipient: recipient, group: group, project: project, milestone: milestone}
  end

  test "status changes skip rich text rendering when the stored comment content is empty", ctx do
    comment = comment_fixture(ctx.author, %{content: %{}})

    Operately.Projects.Milestone
    |> where([m], m.project_id == ^ctx.project.id and m.id != ^ctx.milestone.id)
    |> Operately.Repo.delete_all()

    customer_launch = milestone_fixture(%{project_id: ctx.project.id, title: "Customer launch"})
    post_launch_review = milestone_fixture(%{project_id: ctx.project.id, title: "Post-launch review"})

    set_milestone_inserted_at(customer_launch, ~N[2026-01-01 00:00:00])
    set_milestone_inserted_at(post_launch_review, ~N[2026-01-02 00:00:00])

    activity =
      activity_fixture(%{
        author_id: ctx.author.id,
        action: "project_milestone_commented",
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.group.id,
          "project_id" => ctx.project.id,
          "milestone_id" => ctx.milestone.id,
          "comment_id" => comment.id,
          "comment_action" => "complete"
        }
      })

    flush_emails()
    ProjectMilestoneCommentedEmail.send(ctx.recipient, activity)

    assert_email_sent(fn email ->
      assert email.subject =~ "completed the Important Work milestone"
      assert email.html_body =~ "View Milestone"
      assert email.html_body =~ "Next milestone"
      assert email.html_body =~ "Customer launch"
      refute email.html_body =~ "Post-launch review"
      assert email.text_body =~ "Link:"
      assert email.text_body =~ "Next milestone:"
      assert email.text_body =~ "Customer launch"
      refute email.text_body =~ "Post-launch review"
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

  defp set_milestone_inserted_at(milestone, inserted_at) do
    Operately.Projects.Milestone
    |> where([m], m.id == ^milestone.id)
    |> Operately.Repo.update_all(set: [inserted_at: inserted_at])
  end
end
