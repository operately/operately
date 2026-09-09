defmodule Operately.Features.ActivityFeedTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ActivityFeedSteps, as: Steps

  feature "loads one page ahead as each page's first activity becomes visible", ctx do
    ctx
    |> Steps.setup_feed()
    |> Steps.visit_feed()
    |> Steps.scroll_to_activity(0)
    |> Steps.assert_loaded_count(40)
    |> Steps.scroll_to_activity(20)
    |> Steps.assert_loaded_count(41)
    |> Steps.scroll_to_activity(40)
    |> Steps.assert_finished()
  end
end
