defmodule Operately.Support.Features.ResourceHubSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.{ResourceHub, Node}
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  step :setup, ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("resource_hubs")
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:other_user, :space)

    UI.login_as(ctx, ctx.creator)
  end

  step :given_nested_folders_exist, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:one, :hub)
    |> Factory.add_folder(:two, :hub, :one)
    |> Factory.add_folder(:three, :hub, :two)
    |> Factory.add_folder(:four, :hub, :three)
    |> Factory.add_folder(:five, :hub, :four)
  end

  step :visit_space_page, ctx do
    UI.visit(ctx, Paths.space_path(ctx.company, ctx.space))
  end

  step :visit_resource_hub_page, ctx do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)
    UI.visit(ctx, Paths.resource_hub_path(ctx.company, hub))
  end

  step :visit_folder_page, ctx, folder_name do
    UI.visit(ctx, Paths.folder_path(ctx.company, ctx[folder_name]))
  end

  step :visit_document_page, ctx do
    UI.visit(ctx, Paths.document_path(ctx.company, ctx.document))
  end

  step :navigate_to_resource_hub_page, ctx do
    UI.click(ctx, testid: "resource-hub")
  end

  step :navigate_to_folder, ctx, index: index do
    UI.click(ctx, testid: "node-#{index}")
  end

  step :navigate_back, ctx, name do
    UI.click_link(ctx, name)
  end

  step :create_folder, ctx, folder_name do
    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "new-folder")
    |> UI.fill(testid: "new-folder-name", with: folder_name)
    |> UI.click(testid: "submit")
  end

  step :create_document, ctx, attrs do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "new-document")
    |> UI.assert_page(Paths.new_document_path(ctx.company, hub))
    |> UI.fill(testid: "title", with: attrs.name)
    |> UI.fill_rich_text(attrs.content)
    |> UI.click(testid: "submit")
    |> UI.sleep(200)
    |> UI.refute_has(testid: "submit")
  end

  step :edit_document, ctx, attrs do
    {:ok, node} = Node.get(:system, type: :document, opts: [preload: :document])

    ctx
    |> UI.click(testid: "document-options-button")
    |> UI.click(testid: "edit-document-link")
    |> UI.assert_page(Paths.edit_document_path(ctx.company, node.document))
    |> UI.sleep(500)
    |> UI.fill(testid: "title", with: attrs.name)
    |> UI.fill_rich_text(attrs.content)
    |> UI.click(testid: "submit")
    |> UI.sleep(200)
    |> UI.refute_has(testid: "submit")
  end

  step :delete_document, ctx, document_name do
    {:ok, node} = Node.get(:system, name: document_name, opts: [preload: :document])

    menu_id = UI.testid(["document-menu", Paths.document_id(node.document)])
    delete_id = UI.testid(["delete", Paths.document_id(node.document)])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: delete_id)
  end

  #
  # Assertions
  #

  step :assert_zero_state, ctx do
    ctx
    |> UI.assert_text("Resource Hub")
    |> UI.assert_text("Nothing here just yet.")
    |> UI.assert_text("A place to share rich text documents, images, videos, and other files")
  end

  step :assert_zero_state_on_space_page, ctx do
    UI.find(ctx, UI.query(testid: "resource-hub"), fn ctx ->
      ctx
      |> UI.assert_text("Resource Hub")
      |> UI.assert_text("Nothing here just yet.")
      |> UI.assert_text("A place to share rich text documents, images, videos, and other files")
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
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.items_count)
    end)
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

  step :assert_document_content, ctx, attrs do
    {:ok, node} = Node.get(:system, name: attrs.name, opts: [preload: :document])

    ctx
    |> UI.assert_page(Paths.document_path(ctx.company, node.document))
    |> UI.assert_text(attrs.name)
    |> UI.assert_text(attrs.content)
  end

  step :assert_document_deleted, ctx, document_name do
    ctx
    |> UI.refute_text(document_name)
  end

  #
  # Feed
  #

  step :assert_folder_created_on_space_feed, ctx, folder_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("created the #{folder_name} folder in Resource Hub")
  end

  step :assert_folder_created_on_company_feed, ctx, folder_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("created the #{folder_name} folder in Resource Hub")
  end

  step :assert_document_created_on_space_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("added the #{attrs.name} document")
    |> UI.assert_text(attrs.content)
  end

  step :assert_document_created_on_company_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("added the #{attrs.name} document")
    |> UI.assert_text(attrs.content)
  end

  step :assert_document_edited_on_space_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("edited #{document_name}")
  end

  step :assert_document_edited_on_company_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("edited #{document_name}")
  end

  step :assert_document_deleted_on_space_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("deleted #{document_name} from Resource Hub")
  end

  step :assert_document_deleted_on_company_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("deleted #{document_name} from Resource Hub")
  end

  #
  # Notifications
  #

  step :assert_document_created_notification_sent, ctx, document_name do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "added: #{document_name}",
    })
  end

  step :assert_document_edited_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "edited the document",
    })
  end

  step :assert_document_deleted_notification_sent, ctx, document_name do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "deleted a document: #{document_name}",
    })
  end

  #
  # Emails
  #

  step :assert_document_created_email_sent, ctx, document_name do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: hub.name,
      to: ctx.other_user,
      action: "added a document: #{document_name}",
      author: ctx.creator,
    })
  end

  step :assert_document_edited_email_sent, ctx, document_name do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: hub.name,
      to: ctx.other_user,
      action: "edited a document: #{document_name}",
      author: ctx.creator,
    })
  end

  step :assert_document_deleted_email_sent, ctx, document_name do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: hub.name,
      to: ctx.other_user,
      action: "deleted a document: #{document_name}",
      author: ctx.creator,
    })
  end
end
