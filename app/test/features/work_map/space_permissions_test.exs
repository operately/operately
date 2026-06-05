defmodule Operately.Features.WorkMap.SpacePermissionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  setup ctx, do: Steps.setup_spaces(ctx)

  describe "Space Work Map Permissions" do
    feature "User cannot see secret space work map", ctx do
      ctx
      |> Steps.visit_space_work_map(:hidden_space)
      |> Steps.assert_work_map_not_accessible()
    end

    feature "Zero state - User can add goals/projects", ctx do
      ctx
      |> Steps.visit_space_work_map(:edit_space)
      |> Steps.assert_can_add_items_zero_state()
    end

    feature "Zero state - User cannot add goals/projects", ctx do
      ctx
      |> Steps.visit_space_work_map(:view_space)
      |> Steps.assert_cannot_add_items_zero_state()
    end

    feature "User can add goals/projects", ctx do
      ctx
      |> Steps.given_there_are_items_in_spaces()
      |> Steps.visit_space_work_map(:edit_space)
      |> Steps.assert_can_add_items()
    end

    feature "User cannot add goals/projects", ctx do
      ctx
      |> Steps.given_there_are_items_in_spaces()
      |> Steps.visit_space_work_map(:view_space)
      |> Steps.assert_cannot_add_items()
    end
  end
end
