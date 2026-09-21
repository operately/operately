defmodule Operately.Features.PredictivePreloadingTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.PredictivePreloadingSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "Home warms likely destinations without hovering or recursively warming space tools", ctx do
    ctx
    |> Steps.visit_home()
    |> Steps.assert_home_destinations_preloaded()
    |> Steps.open_preloaded_space()
  end

  feature "Space warms enabled tool pages without hovering", ctx do
    ctx
    |> Steps.visit_space()
    |> Steps.assert_space_tools_preloaded()
    |> Steps.open_preloaded_work_map()
  end
end
