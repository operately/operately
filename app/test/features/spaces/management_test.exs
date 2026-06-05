defmodule Operately.Features.Spaces.ManagementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SpacesCase

  feature "creating a new space", ctx do
    params = %{
      name: "Marketing",
      mission: "Let the world know about our products"
    }

    ctx
    |> Steps.visit_home()
    |> Steps.click_on_add_space()
    |> Steps.fill_in_space_form(params)
    |> Steps.submit_space_form()
    |> Steps.assert_space_created(params)
    |> Steps.assert_creator_is_space_member(params)
    |> Steps.assert_space_creationg_visible_in_activity_feed(params)
  end

  feature "enabling tasks tool makes it visible", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.set_space_tools(tasks_enabled: false)
    |> Steps.visit_space()
    |> Steps.assert_tool_not_visible("tasks-tool")
    |> Steps.open_tools_configuration()
    |> Steps.toggle_tool("task-board")
    |> Steps.save_tools_configuration()
    |> Steps.assert_tool_visible("tasks-tool")
  end

  feature "disabling discussions tool hides it", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.set_space_tools(discussions_enabled: true)
    |> Steps.visit_space()
    |> Steps.assert_tool_visible("messages-tool")
    |> Steps.open_tools_configuration()
    |> Steps.toggle_tool("discussions")
    |> Steps.save_tools_configuration()
    |> Steps.assert_tool_not_visible("messages-tool")
  end

  feature "disabling resource hub hides it", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.set_space_tools(resource_hub_enabled: true)
    |> Steps.given_a_resource_hub_exists()
    |> Steps.visit_space()
    |> Steps.assert_tool_visible("team-resources")
    |> Steps.open_tools_configuration()
    |> Steps.toggle_tool("documents-and-files")
    |> Steps.save_tools_configuration()
    |> Steps.assert_tool_not_visible("team-resources")
  end

  feature "editing space's name and purpose", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.given_that_i_am_on_the_space_page()
    |> Steps.click_edit_space()
    |> Steps.change_space_name_and_purpose()
    |> Steps.assert_space_name_and_purpose_changed()
    |> Steps.assert_space_edit_visible_in_activity_feed()
  end

  feature "deleting an empty space removes it immediately", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.visit_space()
    |> Steps.request_space_deletion()
    |> Steps.assert_space_deleted()
  end

  feature "deleting a populated space requires confirmation", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.given_space_has_subresources()
    |> Steps.visit_space()
    |> Steps.request_space_deletion()
    |> Steps.assert_space_delete_modal_visible()
    |> Steps.assert_space_still_exists()
    |> Steps.confirm_space_deletion()
    |> Steps.assert_space_deleted()
  end
end
