defmodule Operately.Support.Features.HoverPreloadingSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space)
    |> Factory.log_in_person(:creator)
  end

  step :visit_home, ctx do
    UI.visit(ctx, Paths.home_path(ctx.company))
  end

  step :visit_work_map, ctx do
    UI.visit(ctx, Paths.work_map_path(ctx.company))
  end

  step :hover_and_navigate, ctx, resource do
    {path, endpoint} =
      case resource do
        :space -> {Paths.space_path(ctx.company, ctx.space), "/api/v2/spaces/get"}
        :project -> {Paths.project_path(ctx.company, ctx.project), "/api/v2/projects/get"}
        :goal -> {Paths.goal_path(ctx.company, ctx.goal), "/api/v2/goals/get"}
      end

    selector = if resource == :space, do: "[data-test-id=company-home] a[href='#{path}'][title]", else: "a[href='#{path}']"
    ctx = UI.assert_has(ctx, css: selector)
    # Home may already have warmed its space links before the pointer reaches them.
    if resource != :space, do: assert_request_count(ctx, endpoint, 0)
    original_path = Wallaby.Browser.current_path(ctx.session)

    ctx = UI.hover(ctx, css: selector)
    assert_request_count(ctx, endpoint, 1)
    assert Wallaby.Browser.current_path(ctx.session) == original_path

    ctx = ctx |> UI.click(css: selector) |> UI.assert_page(path)
    assert_request_count(ctx, endpoint, 1)
    ctx
  end

  defp assert_request_count(ctx, endpoint, expected) do
    script = """
    return performance.getEntriesByType('resource').filter(entry =>
      new URL(entry.name).pathname === #{Jason.encode!(endpoint)} &&
      (#{Jason.encode!(endpoint)} !== "/api/v2/spaces/get" ||
        (new URL(entry.name).searchParams.get("id") === #{Jason.encode!(Paths.space_id(ctx.space))} &&
         new URL(entry.name).searchParams.get("include_unread_notifications") === "true"))
    ).length;
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
