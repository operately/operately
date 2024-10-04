defmodule Operately.Features.SubscriptionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.SubscriptionsSteps, as: Steps

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "Project Check-in" do
    setup ctx do
      ctx
      |> Factory.add_company_member(:bob)
      |> Factory.add_project(:project, :space, reviewer: :bob)
      |> Factory.add_project_contributor(:fred, :project, :as_person)
      |> Factory.add_project_contributor(:jane, :project, :as_person)
      |> Factory.add_project_contributor(:john, :project, :as_person)
      |> UI.login_as(ctx.creator)
    end

    feature "All contributors", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form(%{status: "on_track", description: "Going well"})
      |> Steps.select_all_people()
      |> Steps.submit_check_in_form()
      |> Steps.asset_current_subscribers(%{count: 5, resource: "check-in"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form(%{status: "on_track", description: "Going well"})
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.submit_check_in_form()
      |> Steps.asset_current_subscribers(%{count: 4, resource: "check-in"})
    end

    feature "No one", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form(%{status: "on_track", description: "Going well"})
      |> Steps.select_no_one()
      |> Steps.submit_check_in_form()
      |> Steps.asset_current_subscribers(%{count: 2, resource: "check-in"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form(%{status: "on_track", description: "Going well"})
      |> Steps.select_all_people()
      |> Steps.submit_check_in_form()
      |> Steps.asset_current_subscribers(%{count: 5, resource: "check-in"})
      |> Steps.open_current_subscriptions_form()
      |> Steps.toggle_person_checkbox(ctx.bob)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.asset_current_subscribers(%{count: 3, resource: "check-in"})
      |> Steps.unsubscribe()
      |> Steps.asset_current_subscribers(%{count: 2, resource: "check-in"})
      |> Steps.open_current_subscriptions_form()
      |> Steps.deselect_everyone()
      |> Steps.save_people_selection()
      |> Steps.asset_current_subscribers(%{count: 0, resource: "check-in"})
      |> Steps.subscribe()
      |> Steps.asset_current_subscribers(%{count: 1, resource: "check-in"})
      |> Steps.open_current_subscriptions_form()
      |> Steps.select_everyone()
      |> Steps.save_people_selection()
      |> Steps.asset_current_subscribers(%{count: 5, resource: "check-in"})
    end
  end
end
