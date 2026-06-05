defmodule Operately.Features.Subscriptions.ProjectCheckInTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SubscriptionsCase

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
      |> Steps.fill_out_check_in_form()
      |> Steps.select_all_people()
      |> Steps.submit_check_in_form()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "check-in"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form()
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.submit_check_in_form()
      |> Steps.assert_current_subscribers(%{count: 4, resource: "check-in"})
    end

    feature "No one", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form()
      |> Steps.select_no_one()
      |> Steps.submit_check_in_form()
      |> Steps.assert_current_subscribers(%{count: 2, resource: "check-in"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> Steps.go_to_new_check_in_page()
      |> Steps.fill_out_check_in_form()
      |> Steps.select_all_people()
      |> Steps.submit_check_in_form()
      |> test_current_subscriptions_widget("check-in")
    end
  end
end
