defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  import Ecto.Query, only: [from: 2]

  def create_goal(ctx) do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    {:ok, goal} = Operately.Goals.create_goal(champion, %{
      company_id: company.id,
      space_id: group.id,
      name: "Improve support first response time",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: %{
        start_date: ~D[2023-01-01],
        end_date: ~D[2023-12-31],
        type: "year"
      },
      targets: [
        %{
          name: "First response time",
          from: 30,
          to: 15,
          unit: "minutes",
          index: 0
        },
        %{
          name: "Increase feedback score to 90%",
          from: 80,
          to: 90,
          unit: "percent",
          index: 1
        }
      ],
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
      anonymous_access_level: Binding.view_access(),
    })

    Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group, goal: goal})
  end

  step :given_a_goal_exists, ctx, goal_params do
    {:ok, _} = Operately.Goals.create_goal(ctx.champion, %{
      company_id: ctx.company.id,
      space_id: ctx.group.id,
      name: goal_params.name,
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      timeframe: %{
        start_date: ~D[2023-01-01],
        end_date: ~D[2023-12-31],
        type: "year"
      },
      targets: [
        %{
          name: goal_params.target_name,
          from: goal_params.from |> Float.parse() |> elem(0),
          to: goal_params.to |> Float.parse() |> elem(0),
          unit: goal_params.unit,
          index: 0
        }
      ],
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
      anonymous_access_level: Binding.view_access(),
    })

    ctx
  end

  step :change_goal_parent, ctx, parent_goal_name do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "change-parent-goal")
    |> UI.click(testid: "goal-#{parent_goal_name |> String.downcase() |> String.replace(" ", "-")}")
  end

  step :assert_goal_parent_changed, ctx, parent_goal_name do
    ctx
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.assert_text(parent_goal_name)
  end

  step :assert_goal_is_company_wide, ctx do
    ctx
    |> UI.assert_text("Company-wide goal")
  end

  step :visit_page, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :archive_goal, ctx do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "archive-goal")
    |> UI.assert_text("Archive this goal?")
    |> UI.click(testid: "confirm-archive-goal")
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_goal_archived, ctx do
    assert Operately.Goals.get_goal!(ctx.goal.id).deleted_at != nil

    ctx |> UI.assert_text("This goal was archived on")
  end

  step :assert_goal_archived_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "archived the #{ctx.goal.name} goal"
    })
  end

  step :assert_goal_archived_feed_posted, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "archived the #{ctx.goal.name} goal"
    })
  end

  step :edit_goal, ctx do
    values = %{
      name: "New Goal Name",
      new_champion: person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John New Champion"}),
      new_reviewer: person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Leonardo New Reviewer"}),
      new_targets: [%{name: "Sold 1000 units", current: 0, target: 1000, unit: "units"}]
    }

    target_count = Enum.count(Operately.Repo.preload(ctx.goal, :targets).targets)

    ctx
    |> Map.put(:edit_values, values)
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "edit-goal-definition")
    |> UI.fill(testid: "goal-name", with: values.name)
    |> UI.select_person_in(id: "champion-search", name: values.new_champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: values.new_reviewer.full_name)
    |> UI.click(testid: "add-target")
    |> then(fn ctx ->
      values.new_targets
      |> Enum.with_index()
      |> Enum.reduce(ctx, fn {target, index}, ctx ->
        ctx
        |> UI.fill(testid: "target-#{target_count + index}-name", with: target.name)
        |> UI.fill(testid: "target-#{target_count + index}-current", with: to_string(target.current))
        |> UI.fill(testid: "target-#{target_count + index}-target", with: to_string(target.target))
        |> UI.fill(testid: "target-#{target_count + index}-unit", with: target.unit)
      end)
    end)
    |> UI.click(testid: "save-changes")
    |> UI.sleep(300) # Wait for the page to update
  end

  step :assert_goal_edited, ctx do
    ctx
    |> UI.assert_page(Paths.goal_path(ctx.company, Operately.Goals.get_goal!(ctx.goal.id)))
    |> UI.assert_text(ctx.edit_values.name)
    |> UI.assert_text(ctx.edit_values.new_champion.full_name)
    |> UI.assert_text(ctx.edit_values.new_reviewer.full_name)
    |> then(fn ctx ->
      ctx.edit_values.new_targets
      |> Enum.reduce(ctx, fn target, ctx ->
        ctx
        |> UI.assert_text(target.name)
        |> UI.assert_text(target.unit)
      end)
    end)
  end

  step :assert_goal_edited_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.edit_values.name,
      to: ctx.edit_values.new_reviewer,
      author: ctx.champion,
      action: "edited the goal"
    })
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.edit_values.name,
      to: ctx.edit_values.new_champion,
      author: ctx.champion,
      action: "edited the goal"
    })
  end

  step :assert_goal_edited_feed_posted, ctx do
    ctx |> FeedSteps.assert_goal_edited(author: ctx.champion)
  end

  step :assert_goal_edited_space_feed_posted, ctx do
    goal = Repo.reload(ctx.goal)

    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_goal_edited(author: ctx.champion, goal_name: goal.name)
  end

  step :assert_goal_edited_company_feed_posted, ctx do
    goal = Repo.reload(ctx.goal)

    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_edited(author: ctx.champion, goal_name: goal.name)
  end

  step :edit_goal_timeframe, ctx do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "edit-goal-timeframe")
    |> UI.click(testid: "end-date-plus-1-month")
    |> UI.fill_rich_text("Extending the timeframe by 1 month to allow for more time to complete it.")
    |> UI.click(testid: "submit")
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_goal_timeframe_edited, ctx do
    original_timeframe = ctx.goal.timeframe
    new_timeframe = Operately.Goals.get_goal!(ctx.goal.id).timeframe

    assert Date.diff(new_timeframe.end_date, original_timeframe.end_date) > 1

    ctx
  end

  step :assert_goal_timeframe_edited_feed_posted, ctx do
    ctx
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "extended the timeframe",
      subtitle: "Extending the timeframe by 1 month to allow for more time to complete it."
    })
  end

  step :assert_goal_timeframe_edited_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "edited the timeframe"
    })
  end

  step :assert_goal_timeframe_edited_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{author: ctx.champion, action: "edited the goal's timeframe"})
  end

  step :comment_on_the_timeframe_change, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-goal_timeframe_editing")
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("I think the timeframe extension is a good idea.")
    |> UI.click(testid: "post-comment")
  end

  step :assert_comment_on_the_timeframe_change_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on the goal timeframe change"
    })
  end

  step :assert_comment_on_the_timeframe_change_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.reviewer,
      title: "commented on the timeframe change",
      subtitle: "I think the timeframe extension is a good idea."
    })
  end

  step :assert_comment_on_the_timeframe_change_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{author: ctx.reviewer, action: "commented on timeframe change"})
  end

  step :comment_on_the_goal_closed, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-goal_closing")
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("I think we did a great job!")
    |> UI.click(testid: "post-comment")
  end

  step :assert_comment_on_the_goal_closing_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.reviewer,
      title: "commented on the goal closing",
      subtitle: "I think we did a great job!"
    })
  end

  step :assert_comment_on_the_goal_closing_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on goal closing"
    })
  end

  step :assert_comment_on_the_goal_closing_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{author: ctx.reviewer, action: "commented on goal closing"})
  end

  step :close_goal, ctx, params do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "close-goal")
    |> UI.assert_text("Close Goal")
    |> UI.click(testid: "success-#{params.success}")
    |> UI.fill_rich_text(params.retrospective)
    |> UI.click(testid: "confirm-close-goal")
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :reopen_goal, ctx, params do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "reopen-goal")
    |> UI.assert_text("Reopening Goal")
    |> UI.fill_rich_text(params.message)
    |> UI.click(testid: "confirm-reopen-goal")
    |> UI.sleep(300)
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :comment_on_the_goal_reopened, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-goal_reopening")
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("I think we did a great job!")
    |> UI.click(testid: "post-comment")
  end

  step :assert_comment_on_the_goal_reopening_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.reviewer,
      title: "commented on the goal reopening",
      subtitle: "I think we did a great job!"
    })
  end

  step :assert_comment_on_the_goal_reopening_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on goal reopening"
    })
  end

  step :assert_comment_on_the_goal_reopening_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{author: ctx.reviewer, action: "commented on goal reopening"})
  end

  step :assert_goal_closed_as_accomplished, ctx do
    goal = Operately.Goals.get_goal!(ctx.goal.id)

    assert goal.closed_at != nil
    assert goal.closed_by_id == ctx.champion.id
    assert goal.success == "yes"

    ctx
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.assert_text("This goal was closed on")
  end

  step :assert_goal_closed_as_dropped, ctx do
    goal = Operately.Goals.get_goal!(ctx.goal.id)

    assert goal.closed_at != nil
    assert goal.closed_by_id == ctx.champion.id
    assert goal.success == "no"

    ctx
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.assert_text("This goal was closed on")
  end

  step :assert_goal_reopened, ctx do
    goal = Operately.Goals.get_goal!(ctx.goal.id)

    refute goal.closed_at
    refute goal.closed_by_id

    ctx
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.refute_text("This goal was closed on")
  end

  step :assert_goal_closed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "closed the #{ctx.goal.name} goal"
    })
  end

  step :assert_goal_reopened_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "reopened the #{ctx.goal.name} goal"
    })
  end

  step :assert_goal_reopened_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "reopened the goal"})
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "reopened the #{ctx.goal.name} goal"})
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "reopened the #{ctx.goal.name} goal"})
  end

  step :assert_goal_closed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "closed the goal"})
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "closed the #{ctx.goal.name} goal"})
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "closed the #{ctx.goal.name} goal"})
  end

  step :assert_goal_closed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "closed the goal"
    })
  end

  step :assert_goal_reopened_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "reopened the #{ctx.goal.name} goal"
    })
  end

  step :visit_goal_list_page, ctx do
    UI.visit(ctx, Paths.space_goals_path(ctx.company, ctx.group))
  end

  step :assert_goal_is_not_editable, ctx do
    ctx
    |> UI.refute_text("Check-In Now")
    |> UI.click(testid: "goal-options")
    |> UI.refute_text("Edit Goal")
    |> UI.refute_text("Change Parent")
    |> UI.refute_text("Mark as Complete")
  end

  step :assert_company_goal_added, ctx, %{name: name, target_name: target_name, from: current, to: target, unit: unit} do
    goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name, preload: [:targets])

    assert goal != nil
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert goal.company_id == ctx.company.id
    assert goal.parent_goal_id == nil
    assert goal.group_id == ctx.group.id
    assert goal.targets != nil
    assert Enum.count(goal.targets) == 1
    assert Enum.at(goal.targets, 0).name == target_name
    assert Enum.at(goal.targets, 0).from == Float.parse(current) |> elem(0)
    assert Enum.at(goal.targets, 0).to == Float.parse(target) |> elem(0)
    assert Enum.at(goal.targets, 0).unit == unit

    ctx
    |> UI.visit(Paths.goals_path(ctx.company))
    |> UI.assert_text(name)
  end

  step :assert_company_goal_created_email_sent, ctx, goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "added the #{goal_name} goal"
    })
  end

  step :initialize_goal_creation_from_global_goals_page, ctx do
    ctx
    |> UI.visit(Paths.goals_path(ctx.company))
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "add-goal")
    |> UI.assert_has(testid: "goal-add-page")
  end

  step :initialize_goal_creation_from_goals_page_via_parent_goal, ctx, parent_goal_name do
    ctx
    |> UI.visit(Paths.goals_path(ctx.company))
    |> UI.hover(testid: "goal-#{UI.testid(parent_goal_name)}")
    |> UI.click(testid: "add-subgoal")
    |> UI.assert_has(testid: "goal-add-page")
  end

  step :initialize_goal_creation_from_global_new_navigation, ctx do
    ctx
    |> UI.click(testid: "new-dropdown")
    |> UI.click(testid: "company-dropdown-new-goal")
    |> UI.assert_has(testid: "goal-add-page")
  end

  step :add_goal, ctx, goal_params do
    ctx
    |> UI.fill(testid: "goal-name", with: goal_params.name)
    |> UI.select_person_in(id: "champion-search", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: ctx.reviewer.full_name)
    |> UI.fill(testid: "target-0-name", with: goal_params.target_name)
    |> UI.fill(testid: "target-0-current", with: goal_params.from)
    |> UI.fill(testid: "target-0-target", with: goal_params.to)
    |> UI.fill(testid: "target-0-unit", with: goal_params.unit)
    |> UI.select(testid: "space-selector", option: ctx.group.name)
    |> then(fn ctx ->
      if Map.has_key?(goal_params, :parent_name) do
        ctx
        |> UI.click(testid: "goal-selector")
        |> UI.click(testid: UI.testid(["goal", goal_params.parent_name]))
      else
        ctx
      end
    end)
    |> UI.click(testid: "add-goal-button")
    |> UI.assert_has(testid: "goal-page")
  end

  step :assert_subgoal_added, ctx, goal_params do
    parent_goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^goal_params.parent_name)
    goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^goal_params.name, preload: [:targets])

    assert goal != nil
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert goal.company_id == ctx.company.id
    assert goal.parent_goal_id == parent_goal.id
    assert goal.group_id == ctx.group.id
    assert goal.targets != nil
    assert Enum.count(goal.targets) == 1
    assert Enum.at(goal.targets, 0).name == goal_params.target_name
    assert Enum.at(goal.targets, 0).from == Float.parse(goal_params.from) |> elem(0)
    assert Enum.at(goal.targets, 0).to == Float.parse(goal_params.to) |> elem(0)
    assert Enum.at(goal.targets, 0).unit == goal_params.unit

    ctx
    |> UI.visit(Paths.goal_path(ctx.company, goal))
    |> UI.assert_text(goal_params.name)
    |> UI.assert_text(goal_params.target_name)
    |> UI.assert_text(goal_params.parent_name)
  end

  step :assert_subgoal_created_email_sent, ctx, goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "added the #{goal_name} goal"
    })
  end

  step :given_a_goal_has_active_subitems, ctx do
    ctx
  end

  step :initiate_goal_closing, ctx do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "close-goal")
    |> UI.assert_text("Close Goal")
  end

  step :assert_warning_about_active_subitems, ctx do
    ctx |> UI.click(testid: "something")
  end

  step :close_goal_with_active_subitems, ctx do
    ctx
    |> UI.click(testid: "success-yes")
    |> UI.fill_rich_text("Closing the goal with active subitems.")
    |> UI.click(testid: "submit")
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_goal_closed, ctx do
    ctx |> UI.click(testid: "something")
  end

end
