defmodule Operately.Features.HoverPreloadingTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.HoverPreloadingSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "Home space links preload and reuse their data on navigation", ctx do
    ctx
    |> Steps.visit_home()
    |> Steps.hover_and_navigate(:space)
  end

  feature "Work Map project links preload and reuse their data on navigation", ctx do
    ctx
    |> Steps.visit_work_map()
    |> Steps.hover_and_navigate(:project)
  end

  feature "Work Map goal links preload and reuse their data on navigation", ctx do
    ctx
    |> Steps.visit_work_map()
    |> Steps.hover_and_navigate(:goal)
  end
end
