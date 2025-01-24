defmodule Operately.Support.Features.ResourceHubDocumentSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.{ResourceHub, Node}
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  def setup(ctx), do: Steps.setup(ctx)
  def visit_resource_hub_page(ctx, name \\ "Documents & Files"), do: Steps.visit_resource_hub_page(ctx, name)
  def visit_folder_page(ctx, folder_key), do: Steps.visit_folder_page(ctx, folder_key)
  def navigate_back(ctx, link), do: Steps.navigate_back(ctx, link)
  def assert_navigation_links(ctx, links), do: Steps.assert_navigation_links(ctx, links)
  def refute_navigation_links(ctx, links), do: Steps.refute_navigation_links(ctx, links)

  step :given_nested_folders_exist, ctx do
    ctx
    |> Steps.create_nested_folders()
  end

  step :given_document_within_nested_folders_exists, ctx do
    ctx
    |> Steps.create_nested_folders()
    |> Factory.add_document(:document, :hub, folder: :five)
  end

  step :given_document_within_resource_hub_root_exists, ctx, hub_key \\ nil do
    if hub_key do
      Factory.add_document(ctx, :document, hub_key)
    else
      ctx
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
    end
  end

  step :given_document_within_folder_exists, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:folder, :hub)
    |> Factory.add_document(:document, :hub, folder: :folder)
  end

  step :given_a_single_draft_document_exists, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, state: :draft)
  end

  step :given_several_draft_documents_exist, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, state: :draft, name: "First Draft")
    |> Factory.add_document(:document2, :hub, state: :draft, name: "Second Draft")
    |> Factory.add_document(:document3, :hub, state: :draft, name: "Third Draft")
  end

  step :visit_document_page, ctx do
    UI.visit(ctx, Paths.document_path(ctx.company, ctx.document))
  end

  step :navigate_to_document, ctx, index: index do
    UI.click(ctx, testid: "node-#{index}")
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
    |> then(fn ctx ->
      {:ok, node} = Node.get(:system, name: attrs.name, opts: [preload: :document])
      Map.put(ctx, :document, node.document)
    end)
  end

  step :create_draft_document, ctx, attrs do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "new-document")
    |> UI.assert_page(Paths.new_document_path(ctx.company, hub))
    |> UI.fill(testid: "title", with: attrs.name)
    |> UI.fill_rich_text(attrs.content)
    |> UI.click(testid: "save-as-draft")
    |> UI.refute_has(testid: "save-as-draft")
    |> then(fn ctx ->
      {:ok, node} = Node.get(:system, name: attrs.name, opts: [preload: :document])
      Map.put(ctx, :document, node.document)
    end)
  end

  step :publish_document, ctx do
    ctx
    |> UI.assert_text("This is an unpublished draft.")
    |> UI.click(testid: "publish-now")
    |> UI.refute_text("This is an unpublished draft.")
  end

  step :edit_and_publish_document, ctx, attrs do
    ctx
    |> UI.click(testid: "continue-editing")
    |> UI.assert_page(Paths.edit_document_path(ctx.company, ctx.document))
    |> UI.fill(testid: "title", with: attrs.name)
    |> UI.fill_rich_text(attrs.content)
    |> UI.click(testid: "publish-draft")
    |> UI.refute_has(testid: "publish-draft")
  end

  step :edit_document, ctx, attrs do
    {:ok, node} = Node.get(:system, type: :document, opts: [preload: :document])

    ctx
    |> UI.click(testid: "edit-document-link")
    |> UI.assert_page(Paths.edit_document_path(ctx.company, node.document))
    |> UI.sleep(500)
    |> UI.fill(testid: "title", with: attrs.name)
    |> UI.fill_rich_text(attrs.content)
    |> UI.click(testid: "submit")
    |> UI.sleep(200)
    |> UI.refute_has(testid: "submit")
  end

  step :copy_document, ctx, new_name do
    ctx
    |> UI.click(testid: UI.testid("menu-#{Paths.document_id(ctx.document)}"))
    |> UI.click(testid: UI.testid("copy-resource-#{Paths.document_id(ctx.document)}"))
    |> UI.fill(testid: "name", with: new_name)
    |> UI.click(testid: "submit")
  end

  step :copy_document_into_folder, ctx, document_name do
    ctx
    |> UI.click(testid: UI.testid("menu-#{Paths.document_id(ctx.document)}"))
    |> UI.click(testid: UI.testid("copy-resource-#{Paths.document_id(ctx.document)}"))
    |> UI.assert_text("Create a copy of #{document_name}")
    |> UI.find(UI.query(testid: "copy-resource-modal"), fn el ->
      el
      |> UI.assert_text(document_name)
      |> UI.click(testid: "go-back-icon")
      |> UI.assert_text("five")
      |> UI.click(testid: "go-back-icon")
      |> UI.assert_text("four")
      |> UI.click(testid: "submit")
    end)
    |> UI.refute_text("Create a copy of #{document_name}")
  end

  step :click_on_continue_writing_draft_link, ctx do
    ctx
    |> UI.click(testid: "continue-editing-draft")
  end

  #
  # Assertions
  #

  step :assert_page_is_document_page, ctx do
    ctx
    |> UI.assert_page(Paths.document_path(ctx.company, ctx.document))
  end

  step :assert_page_is_document_editing, ctx do
    ctx
    |> UI.assert_page(Paths.edit_document_path(ctx.company, ctx.document))
  end

  step :assert_page_is_resource_hub_drafts, ctx do
    ctx
    |> UI.assert_page(Paths.resource_hub_drafts_path(ctx.company, ctx.hub))
  end

  step :assert_document_content, ctx, attrs do
    {:ok, node} = Node.get(:system, name: attrs.name, opts: [preload: :document])

    ctx
    |> UI.assert_page(Paths.document_path(ctx.company, node.document))
    |> UI.assert_text(attrs.name)
    |> UI.assert_text(attrs.content)
  end

  step :assert_document_present_in_files_list, ctx, document_name do
    ctx
    |> UI.assert_text(document_name)
  end

  step :refute_document_present_in_files_list, ctx, document_name do
    ctx
    |> UI.refute_text(document_name)
  end

  step :assert_document_is_draft, ctx do
    ctx
    |> UI.assert_text("This is an unpublished draft.")
  end

  step :assert_draft_actions_on_the_page, ctx do
    ctx
    |> UI.assert_has(testid: "continue-editing")
    |> UI.assert_has(testid: "publish-now")
    |> UI.assert_has(testid: "share-link")
  end

  step :assert_single_draft_document_link_is_visible, ctx do
    ctx
    |> UI.assert_text("Continue writing your draft document")
  end

  step :assert_several_draft_documents_link_is_visible, ctx do
    ctx
    |> UI.assert_text("Continue writing your 3 draft documents")
  end

  step :assert_draft_document_not_visible_and_state_is_zero, ctx do
    ctx
    |> UI.assert_text("Ready for your first document")
    |> UI.assert_text("Your team's central hub for sharing documents, images, videos, and files. Click 'Add' to get started.")
  end

  #
  # Feed
  #

  step :assert_document_created_on_space_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("created a document: #{attrs.name}")
    |> UI.assert_text(attrs.content)
  end

  step :assert_document_created_on_company_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("created a document in the #{ctx.space.name} space: #{attrs.name}")
    |> UI.assert_text(attrs.content)
  end

  step :refute_document_created_on_space_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.refute_text("created a document: #{attrs.name}")
    |> UI.refute_text(attrs.content)
  end

  step :refute_document_created_on_company_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.refute_text("created a document in the #{ctx.space.name} space: #{attrs.name}")
    |> UI.refute_text(attrs.content)
  end

  step :assert_document_edited_on_space_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("edited #{document_name}")
  end

  step :assert_document_edited_on_company_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("edited #{document_name} in the #{ctx.space.name} space")
  end

  step :refute_document_edited_on_space_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.refute_text("edited #{document_name}")
  end

  step :refute_document_edited_on_company_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.refute_text("edited #{document_name} in the #{ctx.space.name} space")
  end

  step :assert_document_copied_on_company_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("created a copy of #{attrs.name} and named it #{attrs.new_name} in the #{ctx.space.name} space")
  end

  step :assert_document_copied_on_space_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("created a copy of #{attrs.name} and named it #{attrs.new_name}")
  end

  step :assert_document_commented_on_company_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("commented on #{document_name} in the #{ctx.space.name} space")
  end

  step :assert_document_commented_on_space_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("commented on #{document_name}")
  end

  step :assert_document_deleted_on_space_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("deleted \"#{document_name}\" from Documents & Files")
  end

  step :assert_document_deleted_on_company_feed, ctx, document_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("deleted \"#{document_name}\" from Documents & Files in the #{ctx.space.name} space")
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

  step :assert_document_copied_notification_sent, ctx, attrs do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "created a copy of #{attrs.name} and named it #{attrs.new_name}",
    })
  end

  step :assert_document_commented_notification_sent, ctx, document_name do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "commented on: #{document_name}",
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
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "added a document: #{document_name}",
      author: ctx.creator,
    })
  end

  step :assert_document_edited_email_sent, ctx, document_name do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "edited a document: #{document_name}",
      author: ctx.creator,
    })
  end

  step :assert_document_copied_email_sent, ctx, document_name do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "copied a document: #{document_name}",
      author: ctx.creator,
    })
  end

  step :assert_document_commented_email_sent, ctx, document_name do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "commented on: #{document_name}",
      author: ctx.creator,
    })
  end

  step :assert_document_deleted_email_sent, ctx, document_name do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "deleted a document: #{document_name}",
      author: ctx.creator,
    })
  end
end
