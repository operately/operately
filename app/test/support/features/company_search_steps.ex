defmodule Operately.Support.Features.CompanySearchSteps do
  use Operately.FeatureCase

  import Ecto.Query

  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Search.{Entry, SourceIndexer}
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product")
    |> Factory.add_project(:website, :space, name: "Website redesign")
    |> Factory.add_project(:portal, :space, name: "Customer portal")
    |> set_project_description(:website, "Customer interviews show that the approval workflow needs to be simpler.")
    |> set_project_description(:portal, "Renewal evidence supports a clearer customer portal.")
    |> index_project(:website)
    |> index_project(:portal)
    |> Factory.log_in_person(:creator)
  end

  step :add_filter_fixtures, ctx do
    ctx
    |> Factory.add_space(:marketing, name: "Marketing")
    |> Factory.add_project(:product_marker, :space, name: "Product marker project")
    |> Factory.add_project(:marketing_marker, :marketing, name: "Marketing marker project")
    |> Factory.add_goal(:product_marker_goal, :space, name: "Product marker goal")
    |> set_project_description(:product_marker, "Shared filter marker for product project")
    |> set_project_description(:marketing_marker, "Shared filter marker for marketing project")
    |> set_goal_description(:product_marker_goal, "Shared filter marker for product goal")
    |> index_project(:product_marker)
    |> index_project(:marketing_marker)
    |> index_goal(:product_marker_goal)
    |> set_entry_updated_at(:marketing_marker, days_ago(1))
    |> set_entry_updated_at(:product_marker, days_ago(5))
    |> set_entry_updated_at(:product_marker_goal, days_ago(40))
  end

  step :visit_search_page, ctx do
    UI.visit(ctx, Paths.search_path(ctx.company))
  end

  step :visit_search_page, ctx, query do
    UI.visit(ctx, Paths.search_path(ctx.company, query))
  end

  step :assert_search_query, ctx, query do
    UI.assert_has(ctx, testid: "company-search-input", value: query)
  end

  step :assert_initial_state, ctx do
    UI.assert_text(ctx, "Search across projects, goals, discussions, documents, and more.")
  end

  step :assert_refine_controls, ctx do
    ctx
    |> UI.assert_has(testid: "search-refine-controls")
    |> UI.assert_has(testid: "search-sort-toggle")
    |> UI.assert_has(testid: "search-filter-spaces")
    |> UI.assert_has(testid: "search-filter-types")
    |> UI.assert_has(testid: "search-filter-time")
    |> UI.refute_has(testid: "search-filter-people")
  end

  step :search_for, ctx, query do
    ctx
    |> UI.fill(testid: "company-search-input", with: query)
    |> UI.sleep(500)
  end

  step :assert_search_location, ctx, query do
    UI.assert_location(ctx, Paths.search_path(ctx.company, query))
  end

  step :assert_project_result, ctx, project_name do
    ctx
    |> UI.wait_until_text(project_name)
    |> UI.assert_has(testid: "company-search-result")
  end

  step :assert_body_match_metadata, ctx do
    ctx
    |> UI.assert_text("PROJECT")
    |> UI.assert_text("Product")
    |> UI.assert_text("approval workflow")
  end

  step :open_project_result, ctx do
    UI.click(ctx, testid: "company-search-result")
  end

  step :assert_project_page, ctx do
    project_path =
      Paths.create_path([
        Paths.company_id(ctx.company),
        "projects",
        Operately.ShortUuid.encode!(ctx.website.id)
      ])

    ctx
    |> UI.assert_page(project_path)
    |> UI.wait_until_has(testid: "project-page")
    |> UI.wait_until_text(ctx.website.name, testid: "project-page")
  end

  step :filter_by_type, ctx, type do
    ctx
    |> UI.click(testid: "search-filter-types")
    |> UI.click(testid: "search-filter-types-option-#{type}")
    |> UI.sleep(500)
  end

  step :filter_by_space, ctx, space_key do
    space = Map.fetch!(ctx, space_key)
    option_id = Paths.space_id(space)

    ctx
    |> UI.click(testid: "search-filter-spaces")
    |> UI.click(testid: "search-filter-spaces-option-#{option_id}")
    |> UI.sleep(500)
  end

  step :sort_by_most_recent, ctx do
    ctx
    |> UI.click(testid: "search-sort-most_recent")
    |> UI.sleep(500)
  end

  step :filter_by_time, ctx, time_range do
    ctx
    |> UI.click(testid: "search-filter-time")
    |> UI.click(testid: "search-filter-time-option-#{time_range}")
    |> UI.sleep(500)
  end

  step :assert_result_visible, ctx, title do
    UI.wait_until_text(ctx, title)
  end

  step :assert_result_hidden, ctx, title do
    UI.refute_text(ctx, title)
  end

  step :assert_first_result, ctx, title do
    script = """
      return document.querySelector('[data-test-id=\"company-search-result\"] h2')?.textContent?.trim();
    """

    UI.execute("assert_first_result", ctx, fn session ->
      Wallaby.Browser.execute_script(session, script, fn result ->
        send(self(), {:first_result_title, result})
      end)
    end)

    receive do
      {:first_result_title, ^title} -> :ok
      {:first_result_title, other} -> flunk("Expected first result #{inspect(title)}, got #{inspect(other)}")
    after
      2_000 -> flunk("Timed out waiting for first search result")
    end

    ctx
  end

  defp set_project_description(ctx, project_name, description) do
    project =
      ctx
      |> Map.fetch!(project_name)
      |> Project.changeset(%{description: RichText.rich_text(description)})
      |> Repo.update!()

    Map.put(ctx, project_name, project)
  end

  defp set_goal_description(ctx, goal_name, description) do
    goal =
      ctx
      |> Map.fetch!(goal_name)
      |> Goal.changeset(%{description: RichText.rich_text(description)})
      |> Repo.update!()

    Map.put(ctx, goal_name, goal)
  end

  defp index_project(ctx, project_name) do
    project = Map.fetch!(ctx, project_name)
    assert {:ok, _summary} = SourceIndexer.sync("project", project.id)
    ctx
  end

  defp index_goal(ctx, goal_name) do
    goal = Map.fetch!(ctx, goal_name)
    assert {:ok, _summary} = SourceIndexer.sync("goal", goal.id)
    ctx
  end

  defp set_entry_updated_at(ctx, resource_key, updated_at) do
    resource = Map.fetch!(ctx, resource_key)

    source_type =
      case resource do
        %Project{} -> :project
        %Goal{} -> :goal
      end

    from(entry in Entry, where: entry.source_type == ^source_type and entry.source_id == ^resource.id)
    |> Repo.update_all(set: [source_updated_at: updated_at])

    ctx
  end

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.shift(day: -days)
    |> DateTime.to_naive()
    |> NaiveDateTime.truncate(:microsecond)
  end
end

