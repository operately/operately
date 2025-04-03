defmodule Operately.Features.PeoplePageTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.PeoplePageSteps, as: Steps

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_company_member(:bob)
    |> Factory.add_company_member(:john)
    |> Factory.add_project(:new_feature, :space, creator: :bob)
    |> Factory.add_project(:improve_performance, :space, creator: :john)
  end

  feature "Feed updates when people change", ctx do
    ctx
    |> UI.login_as(ctx.creator)
    |> Steps.visit_person_page(ctx.bob)
    |> Steps.assert_activity_visible_on_feed(%{name: "Bob", project_name: "new_feature"})
    |> Steps.click_on_person_card(ctx.john)
    |> Steps.assert_activity_visible_on_feed(%{name: "John", project_name: "improve_performance"})
    |> Steps.click_on_person_card(ctx.bob)
    |> Steps.assert_activity_visible_on_feed(%{name: "Bob", project_name: "new_feature"})
  end
end
