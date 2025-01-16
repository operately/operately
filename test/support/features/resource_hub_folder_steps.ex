defmodule Operately.Support.Features.ResourceHubFolderSteps do
  use Operately.FeatureCase

  step :given_nested_folders_exist, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:one, :hub)
    |> Factory.add_folder(:two, :hub, :one)
    |> Factory.add_folder(:three, :hub, :two)
    |> Factory.add_folder(:four, :hub, :three)
    |> Factory.add_folder(:five, :hub, :four)
  end

  step :navigate_to_folder, ctx, index: index do
    UI.click(ctx, testid: "node-#{index}")
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
  end

  step :assert_folder_created, ctx, attrs do
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.name)
      |> UI.assert_text("0 items")
    end)
  end

  step :assert_items_count, ctx, attrs do
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.items_count)
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
end
