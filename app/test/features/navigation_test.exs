defmodule Operately.Features.NavigationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.NavigationSteps, as: Steps

  setup ctx, do: Factory.setup(ctx)

  feature "all dropdown items are visible for admin user", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_as_admin()
    |> Steps.visit_home_page()
    |> Steps.assert_new_dropdown_is_visible()
    |> Steps.assert_new_goal_is_visible()
    |> Steps.assert_new_project_is_visible()
    |> Steps.assert_new_space_is_visible()
    |> Steps.assert_invite_people_is_visible()
  end

  feature "all items visible except invite people", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_with_edit_access()
    |> Steps.visit_home_page()
    |> Steps.assert_new_dropdown_is_visible()
    |> Steps.assert_new_goal_is_visible()
    |> Steps.assert_new_project_is_visible()
    |> Steps.assert_new_space_is_visible()
    |> Steps.assert_invite_people_is_hidden()
  end

  feature "only goal and project items are visible", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_with_comment_access()
    |> Steps.visit_home_page()
    |> Steps.assert_new_dropdown_is_visible()
    |> Steps.assert_new_goal_is_visible()
    |> Steps.assert_new_project_is_visible()
    |> Steps.assert_new_space_is_hidden()
    |> Steps.assert_invite_people_is_hidden()
  end

  feature "new dropdown is completely hidden when user has no permissions", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_with_comment_access()
    |> Steps.given_user_has_comment_access_to_spaces()
    |> Steps.visit_home_page()
    |> Steps.assert_new_dropdown_is_hidden()
  end
end
