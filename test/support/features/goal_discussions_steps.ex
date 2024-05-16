defmodule Operately.Support.Features.GoalDiscussionsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Ecto.Query

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})
    goal = goal_fixture(champion, %{
      company_id: company.id,
      space_id: group.id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
    })

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group, goal: goal})
    ctx = UI.login_based_on_tag(ctx)

    ctx
  end

  step :start_new_discussion, ctx, params do
    ctx
    |> UI.visit("/goals/#{ctx.goal.id}/discussions")
    |> UI.click(testid: "start-discussion")
    |> UI.fill(testid: "discussion-title", with: params.title)
    |> UI.fill_rich_text(params.message)
    |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_submitted, ctx, params do
    activity = Operately.Repo.one(from a in Operately.Activities.Activity, where: a.action == "goal_discussion_creation", limit: 1)

    assert activity != nil
    assert activity.author_id == ctx.champion.id

    comment_thread = Operately.Comments.get_thread!(activity.comment_thread_id)

    assert comment_thread != nil
    assert comment_thread.title == params.title

    ctx
  end

  step :assert_discussion_submitted_email_sent, ctx do
  end

  step :assert_discussion_submitted_feed_posted, ctx do
  end

  step :assert_discussion_submitted_notification_sent, ctx do
  end

  step :edit_discussion, ctx, params do
  end

  step :assert_discusssion_edited, ctx, params do
  end

  step :comment_on_discussion, ctx, message do
  end

  step :assert_comment_submitted, ctx, message do
  end

  step :assert_comment_submitted_email_sent, ctx do
  end

  step :assert_comment_submitted_feed_posted, ctx do
  end

  step :assert_comment_submitted_notification_sent, ctx do
  end

end
