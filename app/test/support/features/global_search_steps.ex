defmodule Operately.Support.Features.GlobalSearchSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI
  alias OperatelyWeb.Paths

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing, name: "Marketing")
    |> Factory.add_space(:product, name: "Product")
    |> Factory.add_space_member(:champion, :product, name: "John Champion")
    |> Factory.add_space_member(:alice, :marketing, name: "Alice Smith")
    |> Factory.add_goal(:support_goal, :product,
      name: "Improve support response time",
      champion: :champion
    )
    |> Factory.add_project(:website_project, :marketing, name: "Website Redesign")
    |> Factory.add_project_milestone(:launch_milestone, :website_project,
      title: "Launch Milestone",
      status: :pending
    )
    |> Factory.add_project_task(:design_task, :launch_milestone, name: "Design homepage")
    |> Factory.log_in_person(:creator)
    |> then(fn ctx ->
      UI.visit(ctx, Paths.home_path(ctx.company))
    end)
  end

  #
  # Opening global search
  #

  step :open_global_search, ctx do
    ctx
    |> UI.click(testid: "header-global-search-activator")
    |> UI.sleep(500)
    |> UI.assert_has(testid: "header-global-search")
  end

  #
  # Searching
  #

  step :search_for, ctx, query do
    ctx
    |> UI.fill(testid: "header-global-search", with: query)
    |> UI.sleep(500)
  end

  step :start_typing, ctx, query do
    ctx
    |> UI.fill(testid: "header-global-search", with: query)
    |> UI.sleep(100)
  end

  #
  # Assertions for search results
  #

  step :assert_project_result_visible, ctx, project_name do
    ctx
    |> UI.assert_text(project_name)
    |> UI.assert_has(testid: UI.testid(["header-global-search-project", project_name]))
  end

  step :assert_goal_result_visible, ctx, goal_name do
    ctx
    |> UI.assert_text(goal_name)
    |> UI.assert_has(testid: UI.testid(["header-global-search-goal", goal_name]))
  end

  step :assert_milestone_result_visible, ctx, milestone_title do
    ctx
    |> UI.assert_text(milestone_title)
    |> UI.assert_has(testid: UI.testid(["header-global-search-milestone", milestone_title]))
  end

  step :assert_task_result_visible, ctx, task_name do
    ctx
    |> UI.assert_text(task_name)
    |> UI.assert_has(testid: UI.testid(["header-global-search-task", task_name]))
  end

  step :assert_person_result_visible, ctx, person_name do
    ctx
    |> UI.assert_text(person_name)
    |> UI.assert_has(testid: UI.testid(["header-global-search-person", person_name]))
  end

  step :refute_milestone_result_visible, ctx, milestone_title do
    ctx
    |> UI.refute_text(milestone_title)
  end

  #
  # Clicking on results
  #

  step :click_project_result, ctx, project_name do
    ctx
    |> UI.click(testid: UI.testid(["header-global-search-project", project_name]))
    |> UI.sleep(300)
  end

  step :click_goal_result, ctx, goal_name do
    ctx
    |> UI.click(testid: UI.testid(["header-global-search-goal", goal_name]))
    |> UI.sleep(300)
  end

  step :click_milestone_result, ctx, milestone_title do
    ctx
    |> UI.click(testid: UI.testid(["header-global-search-milestone", milestone_title]))
    |> UI.sleep(300)
  end

  step :click_task_result, ctx, task_name do
    ctx
    |> UI.click(testid: UI.testid(["header-global-search-task", task_name]))
    |> UI.sleep(300)
  end

  step :click_person_result, ctx, person_name do
    ctx
    |> UI.click(testid: UI.testid(["header-global-search-person", person_name]))
    |> UI.sleep(300)
  end

  #
  # Navigation assertions
  #

  step :assert_navigated_to_project, ctx, project_name do
    project = Operately.Repo.get_by(Operately.Projects.Project, name: project_name)
    ctx |> UI.assert_page(Paths.project_path(ctx.company, project))
  end

  step :assert_navigated_to_goal, ctx, goal_name do
    goal = Operately.Repo.get_by(Operately.Goals.Goal, name: goal_name)
    ctx |> UI.assert_page(Paths.goal_path(ctx.company, goal))
  end

  step :assert_navigated_to_milestone, ctx do
    milestone = ctx.launch_milestone
    ctx |> UI.assert_page(Paths.project_milestone_path(ctx.company, milestone))
  end

  step :assert_navigated_to_task, ctx do
    ctx |> UI.assert_page(Paths.project_task_path(ctx.company, ctx.design_task))
  end

  step :assert_navigated_to_person, ctx, person_name do
    person = Operately.Repo.get_by(Operately.People.Person, full_name: person_name)
    ctx |> UI.assert_page(Paths.profile_path(ctx.company, person))
  end

  #
  # Empty state and error messages
  #

  step :assert_no_results_message, ctx do
    ctx |> UI.assert_text("No results found")
  end

  step :assert_search_not_triggered, ctx do
    ctx
    |> UI.refute_text("PROJECTS")
    |> UI.refute_text("GOALS")
    |> UI.refute_text("MILESTONES")
    |> UI.refute_text("TASKS")
    |> UI.refute_text("PEOPLE")
  end

  step :assert_searching_indicator, ctx do
    ctx |> UI.assert_text("Searching...")
  end

  #
  # Closing search
  #

  step :press_escape, ctx do
    ctx
    |> UI.send_keys([:escape])
    |> UI.sleep(300)
  end

  step :click_outside_search, ctx do
    ctx
    |> UI.click(css: "body")
    |> UI.sleep(300)
  end

  step :assert_search_closed, ctx do
    ctx |> UI.refute_has(testid: "header-global-search")
  end

  #
  # Context information assertions
  #

  step :assert_milestone_shows_project_context, ctx, project_name do
    ctx |> UI.assert_text(project_name)
  end

  step :assert_milestone_shows_space_context, ctx, space_name do
    ctx |> UI.assert_text(space_name)
  end

  step :assert_goal_shows_champion_context, ctx, champion_name do
    ctx |> UI.assert_text(champion_name)
  end

  step :assert_goal_shows_space_context, ctx, space_name do
    ctx |> UI.assert_text(space_name)
  end

  step :assert_task_shows_project_context, ctx, project_name do
    ctx |> UI.assert_text(project_name)
  end

  step :assert_task_shows_space_context, ctx, space_name do
    ctx |> UI.assert_text(space_name)
  end

  #
  # Category headers
  #

  step :assert_category_header_visible, ctx, category_name do
    ctx |> UI.assert_text(category_name)
  end

  #
  # Test data setup
  #

  step :given_all_resource_types_exist, ctx do
    ctx
    |> Factory.add_space(:test_space, name: "Test Space")
    |> Factory.add_space_member(:test_person, :test_space, name: "Test Person")
    |> Factory.add_goal(:test_goal, :test_space,
      name: "Test Goal",
    champion: :test_person
    )
    |> Factory.add_project(:test_project, :test_space, name: "Test Project")
    |> Factory.add_project_milestone(:test_milestone, :test_project,
      title: "Test Milestone",
      status: :pending
    )
    |> Factory.add_project_task(:test_task, :test_milestone, name: "Test Task")
  end

  step :given_done_milestone_exists, ctx, title do
    ctx
    |> Factory.add_project(:completed_project, :marketing, name: "Completed Project")
    |> Factory.add_project_milestone(:done_milestone, :completed_project,
      title: title,
      status: :done
    )
  end

  step :given_closed_project_with_milestone_exists, ctx do
    ctx
    |> Factory.add_project(:closed_project, :marketing,
      name: "Closed Project",
      status: "closed"
    )
    |> Factory.add_project_milestone(:closed_project_milestone, :closed_project,
      title: "Closed Project Milestone",
      status: :pending
    )
    |> Factory.close_project(:closed_project)
  end
end
