defmodule Operately.Features.Subscriptions.MessageTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SubscriptionsCase

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
end
