defmodule Operately.Features.WorkMap.QuickAddPrivacyTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  describe "Space Work Map Quick Add privacy" do
    feature "non-private space can set company permissions in Quick Add", ctx do
      ctx
      |> Steps.setup_empty_space_work_map()
      |> Steps.visit_space_work_map(:space)
      |> Steps.open_zero_state_add_goal()
      |> Steps.open_quick_add_privacy_settings()
      |> Steps.assert_company_members_permissions_visible()
    end

    feature "private space cannot set company permissions in Quick Add", ctx do
      ctx
      |> Steps.setup_empty_private_space_work_map()
      |> Steps.visit_space_work_map(:space)
      |> Steps.open_zero_state_add_goal()
      |> Steps.open_quick_add_privacy_settings()
      |> Steps.refute_company_members_permissions_visible()
    end
  end
end
