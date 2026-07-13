defmodule Operately.Support.Features.SubscriptionsSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  #
  # Project
  #

  step :go_to_project_retrospective_page, ctx do
    ctx
    |> UI.find(UI.query(testid: "closed-status-banner"), fn el ->
      el
      |> UI.click_text("retrospective")
    end)
  end

  step :go_to_new_check_in_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "check-ins"))
    |> UI.click(testid: "check-in-button")
  end

  step :fill_out_check_in_form, ctx do
    ctx
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-on_track")
    |> UI.fill_rich_text("Some description")
  end

  step :submit_check_in_form, ctx do
    ctx
    |> UI.click(testid: "submit")
    |> UI.wait_until_testid(testid: "project-check-in-page")
  end

  step :visit_project_discussions_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "discussions"))
  end

  step :start_add_project_discussion, ctx do
    ctx
    |> UI.click(testid: "start-discussion")
  end

  step :fill_out_discussion, ctx do
    ctx
    |> UI.fill(testid: "discussion-title", with: "Title")
    |> UI.fill_rich_text("Some content")
  end

  step :save_project_discussion, ctx do
    ctx
    |> UI.click(testid: "post-discussion")
  end

  #
  # Messages
  #

  step :go_to_new_message_page, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
  end

  step :fill_out_message_form, ctx do
    ctx
    |> UI.fill(testid: "discussion-title", with: "Some title")
    |> UI.fill_rich_text("Some body")
  end

  step :submit_message_form, ctx do
    ctx
    |> UI.click(testid: "post-discussion")
  end

  #
  # Goal Update
  #

  step :go_to_goal_check_in_page, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "check-ins"))
    |> UI.click(testid: "check-in-button")
  end

  step :fill_out_goal_update_form, ctx do
    ctx
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-option-on-track")
    |> UI.fill_rich_text("Some content")
  end

  step :submit_goal_update_form, ctx do
    ctx
    |> UI.click(testid: "submit")
    |> UI.wait_until_testid(testid: "goal-check-in-page")
  end

  #
  # Subscriptions widget
  #

  step :select_all_people, ctx do
    ctx
    |> UI.click(testid: "subscribe-all")
    |> wait_until_subscription_option_selected("subscribe-all")
  end

  step :select_specific_people, ctx do
    ctx
    |> UI.click(testid: "subscribe-specific-people")
    |> wait_until_subscription_option_selected("subscribe-specific-people")
  end

  step :select_no_one, ctx do
    ctx
    |> UI.click(testid: "subscribe-no-one")
    |> wait_until_subscription_option_selected("subscribe-no-one")
  end

  step :toggle_person_checkbox, ctx, person do
    testid = "person-option-#{Paths.person_id(person)}"

    ctx
    |> UI.click(testid: testid)
  end

  step :open_current_subscriptions_form, ctx do
    ctx
    |> UI.click(testid: "add-remove-subscribers")
  end

  step :save_people_selection, ctx do
    ctx
    |> UI.find(UI.query(testid: "subscribers-selection-modal"), fn el ->
      el
      |> UI.click(testid: "submit")
    end)
  end

  step :close_form_without_saving, ctx do
    ctx
    |> UI.find(UI.query(testid: "subscribers-selection-modal"), fn el ->
      el
      |> UI.click(testid: "cancel")
    end)
  end

  step :unsubscribe, ctx do
    ctx
    |> UI.click(testid: "unsubscribe")
  end

  step :subscribe, ctx do
    ctx
    |> UI.click(testid: "subscribe")
  end

  step :select_everyone, ctx do
    ctx
    |> UI.click(testid: "select-everyone")
  end

  step :deselect_everyone, ctx do
    ctx
    |> UI.click(testid: "select-no-one")
  end

  #
  # Assertions
  #

  step :assert_current_subscribers, ctx, attrs do
    text =
      case attrs.count do
        0 -> "No one"
        1 -> "1 person"
        count -> "#{count} people"
      end

    ctx
    |> UI.wait_until_text("#{text} will be notified when someone comments on this #{attrs.resource}.")
  end

  step :exercise_current_subscriptions_widget, ctx, resource do
    ctx
    |> assert_current_subscribers(%{count: 5, resource: resource})
    |> open_current_subscriptions_form()
    |> toggle_person_checkbox(ctx.bob)
    |> toggle_person_checkbox(ctx.jane)
    |> save_people_selection()
    |> assert_current_subscribers(%{count: 3, resource: resource})
    |> unsubscribe()
    |> assert_current_subscribers(%{count: 2, resource: resource})
    |> open_current_subscriptions_form()
    |> deselect_everyone()
    |> save_people_selection()
    |> assert_current_subscribers(%{count: 0, resource: resource})
    |> open_current_subscriptions_form()
    |> select_everyone()
    |> close_form_without_saving()
    |> assert_current_subscribers(%{count: 0, resource: resource})
    |> subscribe()
    |> assert_current_subscribers(%{count: 1, resource: resource})
    |> open_current_subscriptions_form()
    |> select_everyone()
    |> save_people_selection()
    |> assert_current_subscribers(%{count: 5, resource: resource})
  end

  defp wait_until_subscription_option_selected(ctx, testid) do
    UI.wait_until_has(ctx, Query.css("[data-test-id=\"#{testid}\"]:checked"))
  end
end
