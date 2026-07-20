defmodule Operately.Support.Features.ResourceHubSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.{Document, Folder, File, Link, ResourceHub}
  alias Operately.Updates

  step :setup, ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:other_user, :space)

    UI.login_as(ctx, ctx.creator)
  end

  step :visit_resource_hub_page, ctx, name \\ "Documents & Files" do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id, name: name)
    UI.visit(ctx, Paths.resource_hub_path(ctx.company, hub))
  end

  step :visit_folder_page, ctx, folder_name do
    UI.visit(ctx, Paths.folder_path(ctx.company, ctx[folder_name]))
  end

  step :navigate_back, ctx, name do
    ctx
    |> UI.click_link(name)
    |> wait_for_navigation_target(name)
  end

  step :leave_comment, ctx do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> UI.refute_has(testid: "post-comment")
    |> UI.sleep(300)
    |> then(fn ctx ->
      comment = find_last_comment(ctx)
      Map.put(ctx, :comment, comment)
    end)
  end

  step :assert_comment_present, ctx do
    comment = Map.fetch!(ctx, :comment)

    ctx
    |> UI.assert_has(testid: "comment-#{Paths.comment_id(comment)}")
  end

  step :delete_comment, ctx do
    comment = Map.fetch!(ctx, :comment)

    ctx
    |> UI.find(UI.query(testid: "comment-#{Paths.comment_id(comment)}"), fn el ->
      el
      |> UI.click(testid: "comment-options")
    end)
    |> UI.click(testid: "delete-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_deleted, ctx do
    comment = Map.fetch!(ctx, :comment)

    ctx
    |> UI.refute_has(testid: "comment-#{Paths.comment_id(comment)}")
  end

  step :reload_document_page, ctx do
    cond do
      Map.has_key?(ctx, :document) -> UI.visit(ctx, Paths.document_path(ctx.company, ctx.document))
      Map.has_key?(ctx, :link) -> UI.visit(ctx, Paths.link_path(ctx.company, ctx.link))
      Map.has_key?(ctx, :file) -> UI.visit(ctx, Paths.file_path(ctx.company, ctx.file))
    end
  end

  #
  # Assertions
  #

  step :assert_zero_state, ctx, name \\ "Documents & Files" do
    ctx
    |> UI.assert_text(name)
    |> UI.assert_text("Ready for your first document")
    |> UI.assert_text("Your team's central hub for sharing documents, images, videos, and files. Click 'Add' to get started.")
  end

  step :assert_zero_folder_state, ctx do
    ctx
    |> UI.assert_text("Ready for your first document")
    |> UI.assert_text("This folder is empty. Click 'Add' to upload your first file.")
  end

  step :assert_comments_count, ctx, attrs do
    assert_node_row_contains(ctx, attrs.index, attrs.count)
  end

  step :assert_navigation_links, ctx, links do
    UI.find(ctx, UI.query(testid: "navigation"), fn ctx ->
      Enum.reduce(links, ctx, fn link, ctx ->
        ctx
        |> UI.assert_text(link)
      end)
    end)
  end

  step :refute_navigation_links, ctx, links do
    Enum.reduce(links, ctx, fn link, ctx ->
      ctx
      |> UI.refute_text(link, testid: "navigation")
    end)
  end

  step :assert_page_is_resource_hub_root, ctx, name: name do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id, name: name)

    ctx
    |> UI.assert_page(Paths.resource_hub_path(ctx.company, hub))
  end

  step :assert_page_is_folder_root, ctx, folder_key: key do
    ctx
    |> UI.assert_page(Paths.folder_path(ctx.company, ctx[key]))
  end

  #
  # Deleting resource
  #

  step :delete_resource, ctx, {resource_name, resource_type} do
    resource_id = get_resource_id(resource_name, resource_type)
    menu_id = UI.testid(["menu", resource_id])
    delete_id = UI.testid(["delete", resource_id])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: delete_id)
  end

  step :delete_resource, ctx do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "delete-resource-link")
  end

  step :confirm_deletion, ctx do
    ctx
    |> UI.click(testid: "submit")
  end

  step :assert_resource_deleted, ctx, resource_name do
    ctx
    |> UI.refute_text(resource_name)
  end

  #
  # Moving resource
  #

  step :move_resource_to_child_folder, ctx, {resource_name, resource_type} do
    resource_id = get_resource_id(resource_name, resource_type)
    menu_id = UI.testid(["menu", resource_id])
    move_id = UI.testid(["move", resource_id])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: move_id)
    |> then(&select_move_destination(&1, ctx.hub, ctx.five))
  end

  step :move_resource_to_parent_folder, ctx, {resource_name, resource_type} do
    resource_id = get_resource_id(resource_name, resource_type)
    menu_id = UI.testid(["menu", resource_id])
    move_id = UI.testid(["move", resource_id])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: move_id)
    |> then(&select_move_destination(&1, ctx.five, ctx.one))
  end

  step :move_resource_to_hub_root, ctx, {resource_name, resource_type} do
    resource_id = get_resource_id(resource_name, resource_type)
    menu_id = UI.testid(["menu", resource_id])
    move_id = UI.testid(["move", resource_id])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: move_id)
    |> then(&select_move_destination(&1, ctx.five, ctx.hub))
  end

  step :assert_resource_present_in_files_list, ctx, resource_name do
    ctx
    |> UI.assert_text(resource_name)
  end

  step :refute_resource_present_in_files_list, ctx, document_name do
    ctx
    |> UI.refute_text(document_name)
  end

  #
  # Helpers
  #

  def select_move_destination(ctx, current_location, destination_location) do
    navigate_folder_picker(ctx, "move-resource-modal", current_location, destination_location)
  end

  def select_copy_destination(ctx, current_location, destination_location) do
    navigate_folder_picker(ctx, "copy-resource-modal", current_location, destination_location)
  end

  def assert_node_row_contains(ctx, index, text) do
    UI.assert_text(ctx, text, testid: "node-#{index}")
  end

  def refute_node_row_contains(ctx, index, text) do
    UI.refute_text(ctx, text, testid: "node-#{index}")
  end

  defp find_last_comment(ctx) do
    cond do
      Map.has_key?(ctx, :document) -> Updates.list_comments(ctx.document.id, :resource_hub_document)
      Map.has_key?(ctx, :link) -> Updates.list_comments(ctx.link.id, :resource_hub_link)
      Map.has_key?(ctx, :file) -> Updates.list_comments(ctx.file.id, :resource_hub_file)
    end
    |> List.last()
  end

  def create_nested_folders(ctx) do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:one, :hub)
    |> Factory.add_folder(:two, :hub, :one)
    |> Factory.add_folder(:three, :hub, :two)
    |> Factory.add_folder(:four, :hub, :three)
    |> Factory.add_folder(:five, :hub, :four)
  end

  def get_resource_id(resource_name, :document) do
    {:ok, document} = Document.get(:system, name: resource_name)
    Paths.document_id(document)
  end

  def get_resource_id(resource_name, :link) do
    {:ok, link} = Link.get(:system, name: resource_name)
    Paths.link_id(link)
  end

  def get_resource_id(resource_name, :file) do
    {:ok, file} = File.get(:system, name: resource_name)
    Paths.file_id(file)
  end

  def get_resource_id(resource_name, :folder) do
    {:ok, folder} = Folder.get(:system, name: resource_name)
    Paths.folder_id(folder)
  end

  defp navigate_folder_picker(ctx, modal_testid, current_location, destination_location) do
    hub = picker_hub(ctx, current_location, destination_location)
    current_path = picker_path(current_location, hub)
    destination_path = picker_path(destination_location, hub)
    shared_length = shared_prefix_length(current_path, destination_path)

    back_targets =
      current_path
      |> Enum.slice(shared_length - 1, length(current_path) - shared_length)
      |> Enum.reverse()

    descend_targets = Enum.drop(destination_path, shared_length)

    ctx
    |> UI.assert_has(testid: modal_testid)
    |> wait_for_picker_location(current_location)
    |> click_back_targets(back_targets)
    |> click_folder_targets(descend_targets)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: modal_testid)
  end

  defp click_back_targets(ctx, targets) do
    Enum.reduce(targets, ctx, fn target, ctx ->
      ctx
      |> UI.click(testid: "folder-select-go-back")
      |> wait_for_picker_location(target)
    end)
  end

  defp click_folder_targets(ctx, targets) do
    Enum.reduce(targets, ctx, fn target, ctx ->
      ctx
      |> UI.click(testid: picker_testid("node", target))
      |> wait_for_picker_location(target)
    end)
  end

  defp wait_for_picker_location(ctx, location) do
    UI.assert_has(ctx, testid: picker_testid("current", location))
  end

  defp picker_path(%ResourceHub{} = hub, _root_hub), do: [hub]

  defp picker_path(%Folder{} = folder, root_hub) do
    folder = Folder.find_path_to_folder(folder)
    [root_hub | List.wrap(folder.path_to_folder)] ++ [folder]
  end

  # Counts how many folders both paths share from the start, so we know how many
  # times to click "back" before clicking into the destination folders.
  defp shared_prefix_length(left, right) do
    left
    |> Enum.zip(right)
    |> Enum.take_while(fn {a, b} -> a.id == b.id end)
    |> length()
  end

  defp picker_hub(_ctx, %ResourceHub{} = hub, _destination_location), do: hub
  defp picker_hub(_ctx, _current_location, %ResourceHub{} = hub), do: hub
  defp picker_hub(ctx, _current_location, _destination_location), do: Map.fetch!(ctx, :hub)

  defp picker_testid(prefix, %ResourceHub{} = hub) do
    UI.testid(["folder-select", prefix, Paths.resource_hub_id(hub)])
  end

  defp picker_testid(prefix, %Folder{} = folder) do
    UI.testid(["folder-select", prefix, Paths.folder_id(folder)])
  end

  defp wait_for_navigation_target(ctx, name) do
    case find_navigation_target_path(ctx, name) do
      path when is_binary(path) -> UI.assert_page(ctx, path)
      _ -> ctx
    end
  end

  defp find_navigation_target_path(ctx, name) do
    cond do
      ctx.space.name == name ->
        Paths.space_path(ctx.company, ctx.space)

      true ->
        case ResourceHub.get(:system, space_id: ctx.space.id, name: name) do
          {:ok, hub} ->
            Paths.resource_hub_path(ctx.company, hub)

          _ ->
            case Folder.get(:system, name: name) do
              {:ok, folder} -> Paths.folder_path(ctx.company, folder)
              _ -> nil
            end
        end
    end
  end
end
