defmodule Operately.Support.Features.ResourceHubDocumentSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.{ResourceHub, Node}
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

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

  step :visit_document_page, ctx do
    UI.visit(ctx, Paths.document_path(ctx.company, ctx.document))
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
    |> UI.click(testid: UI.testid("document-menu-#{Paths.document_id(ctx.document)}"))
    |> UI.click(testid: UI.testid("copy-resource-#{Paths.document_id(ctx.document)}"))
    |> UI.fill(testid: "name", with: new_name)
    |> UI.click(testid: "submit")
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
end
