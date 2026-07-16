defmodule Operately.Support.Features.GoalCreationTestSteps do
  use Operately.FeatureCase
  alias Operately.Support.Factory

  import Ecto.Query, only: [from: 2]

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.log_in_person(:creator)
  end

  step :given_a_goal_exists, ctx, goal_params do
    ctx |> Factory.add_goal(:goal, :space, name: goal_params.name)
  end

  step :visit_new_goal_page, ctx do
    ctx |> UI.visit(Paths.new_goal_path(ctx.company))
  end

  step :visit_goal_page, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> wait_until_goal_page()
    |> UI.wait_until_has(testid: "page-header")
  end

  step :click_add_goal_in_related_work, ctx do
    ctx
    |> UI.wait_until_text("Subgoals & Projects", testid: "goal-page")
    |> UI.wait_until_testid(testid: "add-subgoal")
    |> UI.click(testid: "add-subgoal")
  end

  step :fill_in_goal_form, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "goal-name", with: name)
    |> UI.click(testid: "space-field")
    |> UI.click(testid: UI.testid(["space-field", "search-result", "general"]))
  end

  step :fill_in_goal_name, ctx, name do
    ctx
    |> UI.wait_until_testid(testid: "goal-name")
    |> UI.fill_text_field(testid: "goal-name", with: name)
  end

  step :submit, ctx do
    ctx
    |> UI.click(testid: "submit")
    |> UI.sleep(300)
  end

  step :assert_goal_added, ctx, name do
    ctx
    |> wait_until_goal_page()
    |> UI.wait_until_has(testid: "page-header")
    |> UI.assert_text(name)
    |> then(fn ctx ->
      goal = wait_until_goal_created(name)
      Map.put(ctx, :goal, goal)
    end)
  end

  step :assert_goal_docs_and_files_tab_visible, ctx do
    ctx
    |> UI.wait_until_has(testid: "tab-docs & files")
  end

  step :open_goal_docs_and_files, ctx do
    ctx
    |> UI.click_link("Docs & Files")
    |> UI.assert_location(Paths.goal_path(ctx.company, ctx.goal, tab: "docs-and-files"))
    |> UI.wait_until_testid(testid: "docs-and-files-tab")
    |> UI.assert_text("Documents & Files")
  end

  step :assert_goal_docs_and_files_empty_state, ctx do
    ctx
    |> UI.assert_text("Ready for your first document")
    |> UI.assert_text("Your team's central hub for sharing documents, images, videos, and files. Click 'Add' to get started.")
  end

  step :assert_subgoal_form_title_and_subtitle, ctx do
    ctx
    |> wait_until_subgoal_form()
    |> UI.assert_text("Add a subgoal", testid: "goal-add-page")
    |> UI.assert_text("Adding under", testid: "goal-add-page")
    |> UI.assert_text(ctx.goal.name, testid: "goal-add-page")
  end

  step :assert_parent_goal, ctx do
    ctx
    |> wait_until_goal_page()
    |> UI.wait_until_has(testid: "page-header")
    |> UI.wait_until_text(ctx.goal.name, testid: "parent-goal-field")
  end

  step :assert_subgoal_added, ctx, name do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name)

      assert goal != nil
      assert goal.name == name
      assert goal.parent_goal_id == ctx.goal.id
      assert goal.group_id == ctx.goal.group_id
    end)
  end

  step :visit_company_work_map, ctx do
    ctx |> UI.visit(Paths.work_map_path(ctx.company))
  end

  step :click_add_goal_button, ctx do
    ctx |> UI.click(testid: "add-goal")
  end

  step :fill_in_work_item_form, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "item-name", with: name)
  end

  step :assert_work_item_added, ctx, name do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name)
      general = Operately.Repo.one(from s in Operately.Groups.Group, where: s.name == "General")

      assert goal != nil
      assert goal.name == name
      assert goal.parent_goal_id == nil
      assert goal.group_id == general.id
    end)
  end

  step :hover_over_and_click_add_button, ctx, goal_name do
    ctx
    |> UI.hover(testid: UI.testid(["work-item", goal_name]))
    |> UI.click(testid: "add-subitem")
  end

  defp wait_until_goal_created(name, attempts \\ [50, 100, 200, 400, 800, 1600, 3200]) do
    case Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name) do
      nil when attempts == [] ->
        flunk("Timed out waiting for goal #{name} to be created")

      nil ->
        [delay | remaining] = attempts
        :timer.sleep(delay)
        wait_until_goal_created(name, remaining)

      goal ->
        goal
    end
  end

  defp wait_until_subgoal_form(ctx) do
    wait_until_page(ctx, "goal-add-page")
  end

  defp wait_until_goal_page(ctx) do
    wait_until_page(ctx, "goal-page")
  end

  defp wait_until_page(ctx, testid, retry_delays \\ [250, 500, 1_000, 2_000, 2_500, 3_000]) do
    UI.wait_until_testid(ctx, testid: testid)
  rescue
    e in RuntimeError ->
      if retry_delays == [] do
        reraise e, __STACKTRACE__
      else
        [delay | remaining_delays] = retry_delays
        :timer.sleep(delay)
        wait_until_page(ctx, testid, remaining_delays)
      end
  end
end
