defmodule Operately.Support.Features.ResourceHubFolderSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  def setup(ctx), do: Steps.setup(ctx)
  def visit_resource_hub_page(ctx, name \\ "Documents & Files"), do: Steps.visit_resource_hub_page(ctx, name)
  def navigate_back(ctx, link), do: Steps.navigate_back(ctx, link)
  def assert_navigation_links(ctx, links), do: Steps.assert_navigation_links(ctx, links)
  def refute_navigation_links(ctx, links), do: Steps.refute_navigation_links(ctx, links)
  def assert_zero_state(ctx, name \\ "Documents & Files"), do: Steps.assert_zero_state(ctx, name)
  def assert_zero_folder_state(ctx), do: Steps.assert_zero_folder_state(ctx)

  step :given_nested_folders_exist, ctx do
    ctx
    |> Steps.create_nested_folders()
  end

  step :given_folder_exists, ctx, hub_key \\ nil do
    if hub_key do
      Factory.add_folder(ctx, :unique_folder, hub_key)
    else
      ctx
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
    end
  end

  step :given_folder_with_content_exists, ctx, parent_key do
    ctx
    |> Factory.add_folder(:folder, :hub, parent_key)
    |> Factory.add_document(:document, :hub, folder: :folder)
    |> Factory.add_link(:link, :hub, folder: :folder)
    |> Factory.add_file(:file, :hub, folder: :folder)
  end

  step :navigate_to_folder, ctx, index: index do
    UI.click(ctx, testid: "node-#{index}")
  end

  step :visit_space_page, ctx do
    UI.visit(ctx, Paths.space_path(ctx.company, ctx.space))
  end

  step :navigate_to_resource_hub_page, ctx do
    UI.click(ctx, testid: "documents-files")
  end

  step :visit_folder_page, ctx, folder_name do
    UI.visit(ctx, Paths.folder_path(ctx.company, ctx[folder_name]))
  end

  step :create_folder, ctx, folder_name do
    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "new-folder")
    |> UI.fill(testid: "new-folder-name", with: folder_name)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end

  step :rename_folder, ctx, attrs do
    folder_id = Steps.get_resource_id(attrs.current_name)
    menu_id = UI.testid(["menu", folder_id])
    rename_id = UI.testid(["rename", "folder", folder_id])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: rename_id)
    |> UI.fill(testid: "new-folder-name", with: attrs.new_name)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end

  step :copy_folder, ctx, new_name do
    ctx
    |> UI.click(testid: UI.testid("menu-#{Paths.folder_id(ctx.folder)}"))
    |> UI.click(testid: UI.testid("copy-resource-#{Paths.folder_id(ctx.folder)}"))
    |> UI.fill(testid: "name", with: new_name)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end

  step :copy_folder_into_another_folder, ctx, new_name do
    ctx
    |> UI.click(testid: UI.testid("menu-#{Paths.folder_id(ctx.folder)}"))
    |> UI.click(testid: UI.testid("copy-resource-#{Paths.folder_id(ctx.folder)}"))
    |> UI.fill(testid: "name", with: new_name)
    |> UI.find(UI.query(testid: "copy-resource-modal"), fn el ->
      el
      |> UI.click(testid: "three-1")
      |> UI.click(testid: "four-0")
      |> UI.click(testid: "five-0")
      |> UI.refute_has(testid: "five-0")
      |> UI.click(testid: "submit")
    end)
    |> UI.refute_has(testid: "submit")
  end

  step :copy_folder_into_resource_hub_root, ctx, new_name do
    ctx
    |> UI.click(testid: UI.testid("menu-#{Paths.folder_id(ctx.folder)}"))
    |> UI.click(testid: UI.testid("copy-resource-#{Paths.folder_id(ctx.folder)}"))
    |> UI.fill(testid: "name", with: new_name)
    |> UI.find(UI.query(testid: "copy-resource-modal"), fn el ->
      el
      |> UI.click(testid: "go-back-icon")
      |> UI.assert_text("three")
      |> UI.click(testid: "go-back-icon")
      |> UI.assert_text("two")
      |> UI.click(testid: "go-back-icon")
      |> UI.assert_text("one")
      |> UI.click(testid: "go-back-icon")
      |> UI.assert_text("Resource hub")
      |> UI.click(testid: "submit")
    end)
    |> UI.refute_has(testid: "submit")
  end

  step :assert_folder_name, ctx, attrs do
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.name)
    end)
  end

  step :assert_folder_created, ctx, attrs do
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.name)
      |> UI.assert_text("0 items")
    end)
  end

  step :assert_items_count, ctx, attrs do
    ctx
    |> UI.sleep(100)
    |> UI.find(UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.items_count)
    end)
  end

  step :assert_zero_state_on_space_page, ctx do
    UI.find(ctx, UI.query(testid: "documents-files"), fn ctx ->
      ctx
      |> UI.assert_text("Documents & Files")
      |> UI.assert_text("A place to share rich text documents, images, videos, and other files")
    end)
  end

  step :refute_folder_in_files_list, ctx, folder_name do
    ctx
    |> UI.refute_text(folder_name)
  end

  step :assert_folder_and_its_content_was_copied, ctx, attrs do
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.name)
      |> UI.assert_text("3 items")
    end)

    ctx
    |> UI.click(testid: "node-#{attrs.index}")
    |> UI.assert_text("Document")
    |> UI.assert_text("Link")
    |> UI.assert_text("some name")
  end

  #
  # Feed
  #

  step :assert_folder_created_on_space_feed, ctx, folder_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("created a folder: #{folder_name}")
  end

  step :assert_folder_created_on_company_feed, ctx, folder_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("created a folder in the #{ctx.space.name} space: #{folder_name}")
  end

  step :assert_folder_deleted_on_space_feed, ctx, folder_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("deleted the \"#{folder_name}\" folder from Documents & Files")
  end

  step :assert_folder_deleted_on_company_feed, ctx, folder_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("deleted the \"#{folder_name}\" folder from Documents & Files in the #{ctx.space.name} space")
  end

  step :assert_folder_copied_on_space_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("made a copy of the #{attrs.original_name} folder and named it #{attrs.name}")
  end

  step :assert_folder_copied_on_company_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("made a copy of the #{attrs.original_name} folder in the #{ctx.space.name} space and named it #{attrs.name}")
  end
end
