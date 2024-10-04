defmodule Operately.Support.Features.SubscriptionsSteps do
  use Operately.FeatureCase

  #
  # Project
  #

  step :go_to_project_retrospective_page, ctx do
    ctx
    |> UI.click(testid: "project-retrospective-link")
  end

  step :go_to_new_check_in_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "check-in-now")
  end

  step :fill_out_check_in_form, ctx, attrs do
    ctx
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{attrs.status}")
    |> UI.fill_rich_text(attrs.description)
  end

  step :submit_check_in_form, ctx do
    ctx
    |> UI.click(testid: "post-check-in")
  end

  #
  # Messages
  #

  step :go_to_new_message_page, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
  end

  step :fill_out_message_form, ctx, attrs do
    ctx
    |> UI.fill(testid: "discussion-title", with: attrs.title)
    |> UI.fill_rich_text(attrs.body)
  end

  step :submit_message_form, ctx do
    ctx
    |> UI.click(testid: "post-discussion")
  end

  #
  # Subscriptions widget
  #

  step :select_all_people, ctx do
    ctx
    |> UI.click(testid: "subscribe-all")
  end

  step :select_specific_people, ctx do
    ctx
    |> UI.click(testid: "subscribe-specific-people")
  end

  step :select_no_one, ctx do
    ctx
    |> UI.click(testid: "subscribe-no-one")
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
    text = case attrs.count do
      0 -> "No one"
      1 -> "1 person"
      count -> "#{count} people"
    end

    ctx
    |> UI.assert_text("#{text} will be notified when someone comments on this #{attrs.resource}.")
  end
end
