defmodule Operately.Features.SubscriptionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.SubscriptionsSteps, as: Steps
  alias Operately.Support.Features.ProjectRetrospectiveSteps

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

  describe "Project Retrospective" do
    setup ctx do
      params = %{
        "author" => ctx.creator,
        "what-went-well" => "We built the thing",
        "what-could-ve-gone-better" => "We built the thing",
        "what-did-you-learn" => "We learned the thing"
      }
      ctx = Map.put(ctx, :params, params)

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
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_all_people()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "project retrospective"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.assert_current_subscribers(%{count: 4, resource: "project retrospective"})
    end

    feature "No one", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_no_one()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.assert_current_subscribers(%{count: 2, resource: "project retrospective"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_all_people()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> test_current_subscriptions_widget("project retrospective")
    end
  end

  describe "Message" do
    setup ctx do
      ctx
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:fred, :space)
      |> Factory.add_space_member(:jane, :space)
      |> Factory.add_space_member(:john, :space)
      |> UI.login_as(ctx.creator)
    end

    feature "All contributors", ctx do
      ctx
      |> Steps.go_to_new_message_page()
      |> Steps.fill_out_message_form()
      |> Steps.select_all_people()
      |> Steps.submit_message_form()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "discussion"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> Steps.go_to_new_message_page()
      |> Steps.fill_out_message_form()
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.submit_message_form()
      |> Steps.assert_current_subscribers(%{count: 3, resource: "discussion"})
    end

    feature "No one", ctx do
      ctx
      |> Steps.go_to_new_message_page()
      |> Steps.fill_out_message_form()
      |> Steps.select_no_one()
      |> Steps.submit_message_form()
      |> Steps.assert_current_subscribers(%{count: 1, resource: "discussion"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> Steps.go_to_new_message_page()
      |> Steps.fill_out_message_form()
      |> Steps.select_all_people()
      |> Steps.submit_message_form()
      |> test_current_subscriptions_widget("discussion")
    end
  end

  describe "Goal Update" do
    setup ctx do
      ctx
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:fred, :space)
      |> Factory.add_space_member(:jane, :space)
      |> Factory.add_space_member(:john, :space)
      |> Factory.add_goal(:goal, :space)
      |> UI.login_as(ctx.creator)
    end

    feature "All contributors", ctx do
      ctx
      |> Steps.go_to_new_goal_update_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_all_people()
      |> Steps.submit_goal_update_form()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "update"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> Steps.go_to_new_goal_update_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.submit_goal_update_form()
      |> Steps.assert_current_subscribers(%{count: 3, resource: "update"})
    end

    feature "No one", ctx do
      ctx
      |> Steps.go_to_new_goal_update_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_no_one()
      |> Steps.submit_goal_update_form()
      |> Steps.assert_current_subscribers(%{count: 1, resource: "update"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> Steps.go_to_new_goal_update_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_all_people()
      |> Steps.submit_goal_update_form()
      |> test_current_subscriptions_widget("update")
    end
  end

  defp test_current_subscriptions_widget(ctx, resource) do
    ctx
    |> Steps.assert_current_subscribers(%{count: 5, resource: resource})
    |> Steps.open_current_subscriptions_form()
    |> Steps.toggle_person_checkbox(ctx.bob)
    |> Steps.toggle_person_checkbox(ctx.jane)
    |> Steps.save_people_selection()
    |> Steps.assert_current_subscribers(%{count: 3, resource: resource})
    |> Steps.unsubscribe()
    |> Steps.assert_current_subscribers(%{count: 2, resource: resource})
    |> Steps.open_current_subscriptions_form()
    |> Steps.deselect_everyone()
    |> Steps.save_people_selection()
    |> Steps.assert_current_subscribers(%{count: 0, resource: resource})
    |> Steps.open_current_subscriptions_form()
    |> Steps.select_everyone()
    |> Steps.close_form_without_saving()
    |> Steps.assert_current_subscribers(%{count: 0, resource: resource})
    |> Steps.subscribe()
    |> Steps.assert_current_subscribers(%{count: 1, resource: resource})
    |> Steps.open_current_subscriptions_form()
    |> Steps.select_everyone()
    |> Steps.save_people_selection()
    |> Steps.assert_current_subscribers(%{count: 5, resource: resource})
  end
end
