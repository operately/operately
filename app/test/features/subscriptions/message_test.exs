defmodule Operately.Features.Subscriptions.MessageTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SubscriptionsSteps, as: Steps
  alias Operately.Support.Features.DiscussionsSteps

  setup ctx, do: Steps.setup(ctx)

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

    feature "Subscribe and unsubscribe across cached navigation", ctx do
      ctx
      |> Steps.go_to_new_message_page()
      |> Steps.fill_out_message_form()
      |> Steps.select_all_people()
      |> Steps.submit_message_form()
      |> DiscussionsSteps.set_page_reload_marker()
      |> Steps.exercise_current_subscriptions_widget("discussion")
      |> Steps.unsubscribe()
      |> UI.assert_has(testid: "subscribe")
      |> UI.click(css: "a[href='#{Paths.space_discussions_path(ctx.company, ctx.space)}']")
      |> UI.click(testid: "discussion-list-item-some-title")
      |> UI.assert_has(testid: "subscribe")
      |> Steps.subscribe()
      |> UI.assert_has(testid: "unsubscribe")
      |> DiscussionsSteps.assert_page_was_not_reloaded()
    end
  end
end
