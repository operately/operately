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
end
