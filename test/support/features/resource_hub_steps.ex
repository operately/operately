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

  step :given_document_within_nested_folders_exists, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:one, :hub)
    |> Factory.add_folder(:two, :hub, :one)
    |> Factory.add_folder(:three, :hub, :two)
    |> Factory.add_folder(:four, :hub, :three)
    |> Factory.add_folder(:five, :hub, :four)
    |> Factory.add_document(:document, :hub, folder: :five)
  end

  step :given_file_within_nested_folders_exists, ctx do
    ctx =
      ctx
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:one, :hub)
      |> Factory.add_folder(:two, :hub, :one)
      |> Factory.add_folder(:three, :hub, :two)
      |> Factory.add_folder(:four, :hub, :three)
      |> Factory.add_folder(:five, :hub, :four)

    file = create_file(ctx, ctx.hub, ctx.five.id)
    Map.put(ctx, :file, file)
  end

  step :given_file_exists, ctx do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    file = create_file(ctx, hub)
    Map.put(ctx, :file, file)
  end

  step :visit_space_page, ctx do
    UI.visit(ctx, Paths.space_path(ctx.company, ctx.space))
  end

  step :visit_resource_hub_page, ctx, name \\ "Documents & Files" do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id, name: name)
    UI.visit(ctx, Paths.resource_hub_path(ctx.company, hub))
  end

  step :visit_folder_page, ctx, folder_name do
    UI.visit(ctx, Paths.folder_path(ctx.company, ctx[folder_name]))
  end

  step :visit_document_page, ctx do
    UI.visit(ctx, Paths.document_path(ctx.company, ctx.document))
  end

  step :visit_file_page, ctx do
    UI.visit(ctx, Paths.file_path(ctx.company, ctx.file))
  end

  step :navigate_to_resource_hub_page, ctx do
    UI.click(ctx, testid: "documents-files")
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

  step :go_to_copy_document_page, ctx, document_name do
    {:ok, node} = Node.get(:system, name: document_name, opts: [preload: :document])

    ctx
    |> UI.click(testid: "document-options-button")
    |> UI.click(testid: "copy-document-link")
    |> UI.assert_page(Paths.copy_document_path(ctx.company, node.document))
  end

  step :enter_document_name, ctx, name do
    ctx
    |> UI.fill(testid: "title", with: name)
  end

  step :copy_document, ctx do
    ctx
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

  step :delete_document, ctx do
    ctx
    |> UI.click(testid: "document-options-button")
    |> UI.click(testid: "delete-document-link")
  end

  step :delete_document, ctx, document_name do
    {:ok, node} = Node.get(:system, name: document_name, opts: [preload: :document])

    menu_id = UI.testid(["document-menu", Paths.document_id(node.document)])
    delete_id = UI.testid(["delete", Paths.document_id(node.document)])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: delete_id)
  end

  step :leave_comment, ctx do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> UI.refute_has(testid: "post-comment")
  end

  #
  # Assertions
  #

  step :assert_zero_state, ctx, name \\ "Documents & Files"  do
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

  step :assert_zero_state_on_space_page, ctx do
    UI.find(ctx, UI.query(testid: "documents-files"), fn ctx ->
      ctx
      |> UI.assert_text("Documents & Files")
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

  step :assert_comments_count, ctx, attrs do
    UI.find(ctx, UI.query(testid: "node-#{attrs.index}"), fn ctx ->
      ctx
      |> UI.assert_text(attrs.count)
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

  step :assert_document_present_in_files_list, ctx, document_name do
    ctx
    |> UI.assert_text(document_name)
  end

  step :refute_document_present_in_files_list, ctx, document_name do
    ctx
    |> UI.refute_text(document_name)
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

  step :assert_file_commented_on_company_feed, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("commented on #{ctx.file.node.name} in the #{ctx.space.name} space")
  end

  step :assert_file_commented_on_space_feed, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("commented on #{ctx.file.node.name}")
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

  step :assert_file_commented_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "commented on: #{ctx.file.node.name}",
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

  step :assert_document_deleted_email_sent, ctx, document_name do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "deleted a document: #{document_name}",
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

  step :assert_file_commented_email_sent, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "commented on: #{ctx.file.node.name}",
      author: ctx.creator,
    })
  end

  #
  # Helpers
  #

  defp create_file(ctx, hub, folder_id \\ nil) do
    blob = Operately.BlobsFixtures.blob_fixture(%{author_id: ctx.creator.id, company_id: ctx.company.id})

    {:ok, files} = Operately.Operations.ResourceHubFileCreating.run(ctx.creator, hub, %{
      files: [
        %{
          blob_id: blob.id,
          name: "Some name",
          description: Operately.Support.RichText.rich_text("Content"),
        }
      ],
      send_to_everyone: true,
      subscription_parent_type: :resource_hub_file,
      subscriber_ids: [ctx.other_user.id],
      folder_id: folder_id,
    })

    hd(files)
  end
end
