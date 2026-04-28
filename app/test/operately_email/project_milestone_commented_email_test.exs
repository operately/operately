defmodule OperatelyEmail.ProjectMilestoneCommentedEmailTest do
  use Operately.DataCase

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
      assert email.text_body =~ "Link:"
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
