defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase

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
      timeframe: "2023-Q4",
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
      ]
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
      timeframe: "2023-Q4",
      targets: [
        %{
          name: goal_params.target_name,
          from: goal_params.from |> Float.parse() |> elem(0),
          to: goal_params.to |> Float.parse() |> elem(0),
          unit: goal_params.unit,
          index: 0
        }
      ]
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
    |> UI.assert_page("/goals/#{ctx.goal.id}")
    |> UI.assert_text(parent_goal_name)
  end

  step :assert_goal_is_company_wide, ctx do
    ctx
    |> UI.assert_text("Company-wide goal")
  end

  def submit_check_in(ctx, message, target_values: target_values) do
    ctx
    |> visit_page()
    |> UI.click(testid: "check-in-now")
    |> UI.fill_rich_text(message)
    |> UI.fill(testid: "target-first-response-time", with: to_string(Enum.at(target_values, 0)))
    |> UI.fill(testid: "target-increase-feedback-score-to-90-", with: to_string(Enum.at(target_values, 1)))
    |> UI.click(testid: "submit-check-in")
  end

  def assert_check_in_submitted(ctx, message, target_values: target_values) do
    ctx
    |> UI.assert_text("Check-In from")
    |> UI.assert_text(message)
    |> UI.assert_text("First response time")
    |> UI.assert_text("Increase feedback score to 90%")
    |> UI.assert_text("#{Enum.at(target_values, 1)} / 90")
    |> UI.assert_text("#{Enum.at(target_values, 0)} / 15")
  end

  def assert_check_in_visible_in_goal_feed(ctx) do
    ctx
    |> visit_page()
    |> FeedSteps.assert_goal_check_in(author: ctx.champion)
  end

  def assert_check_in_email_sent_to_reviewer(ctx) do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "submitted a check-in"
    })
  end

  step :visit_page, ctx do
    UI.visit(ctx, "/goals/#{ctx.goal.id}")
  end

  step :archive_goal, ctx do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "archive-goal")
    |> UI.assert_text("Archive this goal?")
    |> UI.click(testid: "confirm-archive-goal")
    |> UI.assert_page("/goals/#{ctx.goal.id}")
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
    |> NotificationsSteps.assert_goal_archived_sent(author: ctx.champion, goal: ctx.goal)
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
    |> UI.click(testid: "edit-goal")
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
    |> UI.assert_page("/goals/#{ctx.goal.id}")
  end

  step :assert_goal_edited, ctx do
    ctx
    |> UI.assert_page("/goals/#{ctx.goal.id}")
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

  step :close_goal, ctx do
    ctx
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "mark-as-complete")
    |> UI.assert_text("Mark this goal as complete?")
    |> UI.click(testid: "confirm-close-goal")
    |> UI.assert_page("/goals/#{ctx.goal.id}")
  end

  step :assert_goal_closed, ctx do
    goal = Operately.Goals.get_goal!(ctx.goal.id)

    assert goal.closed_at != nil
    assert goal.closed_by_id == ctx.champion.id

    ctx 
    |> UI.assert_page("/goals/#{ctx.goal.id}")
    |> UI.assert_text("This goal was completed on")
  end

  step :assert_goal_closed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "completed the #{ctx.goal.name} goal"
    })
  end

  step :assert_goal_closed_feed_posted, ctx do
    ctx
    |> UI.visit("/goals/#{ctx.goal.id}")
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "completed this goal"})
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "completed the #{ctx.goal.name} goal"})
    |> UI.visit("/feed")
    |> FeedSteps.assert_feed_item_exists(%{author: ctx.champion, title: "completed the #{ctx.goal.name} goal"})
  end

  step :assert_goal_closed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "completed the #{ctx.goal.name} goal"
    })
  end

  step :visit_goal_list_page, ctx do
    UI.visit(ctx, "/spaces/#{ctx.group.id}/goals")
  end

  step :assert_goal_is_not_editable, ctx do
    ctx
    |> UI.refute_text("Check-In Now")
    |> UI.click(testid: "goal-options")
    |> UI.refute_text("Edit Goal")
    |> UI.refute_text("Change Parent")
    |> UI.refute_text("Mark as Complete")
  end

  step :visit_company_goals_page, ctx do
    UI.visit(ctx, "/goals")
  end

  step :add_company_goal, ctx, %{name: name, target_name: target_name, from: current, to: target, unit: unit} do
    ctx
    |> UI.click(testid: "add-company-wide-goal")
    |> UI.fill(testid: "goal-name", with: name)
    |> UI.select_person_in(id: "champion-search", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: ctx.reviewer.full_name)
    |> UI.fill(testid: "target-0-name", with: target_name)
    |> UI.fill(testid: "target-0-current", with: current)
    |> UI.fill(testid: "target-0-target", with: target)
    |> UI.fill(testid: "target-0-unit", with: unit)
    |> UI.select(testid: "space-selector", option: ctx.group.name)
    |> UI.click(testid: "add-goal-button")
    |> UI.assert_text("About") # TODO: this is a hack to wait for the goal page to load
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
    |> UI.visit("/goals")
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

  step :add_subgoal, ctx, %{parent_name: parent_goal_name, goal_params: goal_params} do
    parent_test_id = "#{parent_goal_name |> String.downcase() |> String.replace(" ", "-")}"

    ctx
    |> UI.hover(testid: "goal-#{parent_test_id}")
    |> UI.click(testid: "goal-options-#{parent_test_id}")
    |> UI.click(testid: "add-subgoal")
    |> UI.fill(testid: "goal-name", with: goal_params.name)
    |> UI.select_person_in(id: "champion-search", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: ctx.reviewer.full_name)
    |> UI.fill(testid: "target-0-name", with: goal_params.target_name)
    |> UI.fill(testid: "target-0-current", with: goal_params.from)
    |> UI.fill(testid: "target-0-target", with: goal_params.to)
    |> UI.fill(testid: "target-0-unit", with: goal_params.unit)
    |> UI.select(testid: "space-selector", option: ctx.group.name)
    |> UI.click(testid: "add-goal-button")
    |> UI.assert_text("About") # TODO: this is a hack to wait for the goal page to load
  end

  step :assert_subgoal_added, ctx, %{parent_name: parent_goal_name, goal_params: goal_params} do
    parent_goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^parent_goal_name)
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
    |> UI.visit("/goals/#{goal.id}")
    |> UI.assert_text(goal_params.name)
    |> UI.assert_text(goal_params.target_name)
    |> UI.assert_text(parent_goal_name)
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
end
