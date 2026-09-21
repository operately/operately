defmodule Operately.Support.Features.PredictivePreloadingSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.set_space_tools(:space, tasks_enabled: true, kpis_enabled: true)
    |> Factory.fetch_default_resource_hub(:hub, :space)
    |> Factory.log_in_person(:creator)
  end

  step :visit_home, ctx do
    UI.visit(ctx, Paths.home_path(ctx.company))
  end

  step :visit_space, ctx do
    UI.visit(ctx, Paths.space_path(ctx.company, ctx.space))
  end

  step :assert_home_destinations_preloaded, ctx do
    assert_request_count(ctx, "/companies/get_work_map", %{}, 1)
    assert_request_count(ctx, "/people/get", %{id: Paths.person_id(ctx.creator)}, 1)
    assert_request_count(ctx, "/people/list_assignments", %{}, 1)
    assert_request_count(ctx, "/spaces/get", space_input(ctx), 1)
    assert_request_count(ctx, "/spaces/list_tools", %{space_id: Paths.space_id(ctx.space)}, 1)
    assert_request_count(ctx, "/spaces/list_discussions", %{}, 0)
    assert Wallaby.Browser.current_path(ctx.session) == Paths.home_path(ctx.company)
    ctx
  end

  step :open_preloaded_space, ctx do
    path = Paths.space_path(ctx.company, ctx.space)
    ctx = ctx |> UI.click(css: "[data-test-id=company-home] a[href='#{path}'][title]") |> UI.assert_page(path)
    assert_request_count(ctx, "/spaces/get", space_input(ctx), 1)
    ctx
  end

  step :assert_space_tools_preloaded, ctx do
    input = %{space_id: Paths.space_id(ctx.space)}
    assert_request_count(ctx, "/companies/get_work_map", input, 1)
    assert_request_count(ctx, "/spaces/list_discussions", input, 1)
    assert_request_count(ctx, "/resource_hubs/get", %{id: Paths.resource_hub_id(ctx.hub)}, 1)
    assert_request_count(ctx, "/spaces/list_tasks", input, 1)
    assert_request_count(ctx, "/kpis/list_kpis", input, 1)
    assert_request_count(ctx, "/project_templates/list", input, 1)
    assert Wallaby.Browser.current_path(ctx.session) == Paths.space_path(ctx.company, ctx.space)
    ctx
  end

  step :open_preloaded_work_map, ctx do
    path = Paths.space_work_map_path(ctx.company, ctx.space)
    ctx = ctx |> UI.click(css: "a[href='#{path}']") |> UI.assert_page(path)
    assert_request_count(ctx, "/companies/get_work_map", %{space_id: Paths.space_id(ctx.space)}, 1)
    ctx
  end

  defp space_input(ctx), do: %{id: Paths.space_id(ctx.space), include_unread_notifications: "true"}

  defp assert_request_count(ctx, endpoint, params, expected) do
    script = """
    return performance.getEntriesByType('resource').filter(entry => {
      const url = new URL(entry.name);
      return url.pathname === #{Jason.encode!("/api/v2" <> endpoint)} &&
        Object.entries(#{Jason.encode!(params)}).every(([key, value]) => url.searchParams.get(key) === value);
    }).length;
    """

    assert {:ok, ^expected} =
             Wallaby.Browser.retry(fn ->
               Wallaby.Browser.execute_script(ctx.session, script, fn count -> send(self(), {:request_count, count}) end)

               receive do
                 {:request_count, ^expected} -> {:ok, expected}
                 {:request_count, count} -> {:error, {:request_count, count}}
               end
             end)
  end
end
