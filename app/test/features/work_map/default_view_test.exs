defmodule Operately.Features.WorkMap.DefaultViewTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  feature "saved timeline opens as the company default on a fresh visit", ctx do
    ctx
    |> Steps.setup_company_work_map()
    |> Factory.enable_feature("work_map_v2")
    |> Steps.visit_company_work_map()
    |> Steps.save_timeline_as_default()
    |> Steps.visit_company_work_map()
    |> Steps.assert_timeline_selected()
  end
end
