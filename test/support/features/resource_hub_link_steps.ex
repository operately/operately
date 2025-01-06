defmodule Operately.Support.Features.ResourceHubLinkSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.Node
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  step :given_link_exists, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_link(:link, :hub)
  end

  step :given_link_within_nested_folders_exists, ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:one, :hub)
    |> Factory.add_folder(:two, :hub, :one)
    |> Factory.add_folder(:three, :hub, :two)
    |> Factory.add_folder(:four, :hub, :three)
    |> Factory.add_folder(:five, :hub, :four)
    |> Factory.add_link(:link, :hub, folder: :five)
  end

  step :visit_link_page, ctx do
    UI.visit(ctx, Paths.link_path(ctx.company, ctx.link))
  end

  defp create_link(ctx, attrs, testid, type_testid \\ nil) do
    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "add-link")
    |> UI.click(testid: testid)
    |> UI.fill(testid: "title", with: attrs.title)
    |> UI.fill(testid: "link", with: attrs.url)
    |> then(fn ctx ->
      if type_testid do
        ctx
        |> UI.click(testid: type_testid)
      else
        ctx
      end
    end)
    |> UI.fill_rich_text(attrs.notes)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end

  step :create_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-other-resource")
  end

  step :create_airtable_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-airtable")
  end

  step :create_dropbox_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-dropbox")
  end

  step :create_figma_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-figma")
  end

  step :create_notion_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-notion")
  end

  step :create_google_doc_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-google-drive", "type-google_doc")
  end

  step :create_google_sheet_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-google-drive", "type-google_sheet")
  end

  step :create_google_slide_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-google-drive", "type-google_slides")
  end

  step :create_google_link, ctx, attrs do
    ctx
    |> create_link(attrs, "link-to-google-drive", "type-google")
  end

  step :edit_link, ctx, attrs do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-link-link")
    |> UI.fill(testid: "title", with: attrs.title)
    |> UI.fill(testid: "link", with: attrs.url)
    |> UI.fill_rich_text(attrs.notes)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end

  step :delete_link, ctx do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "delete-link")
  end

  step :delete_link, ctx, link_name do
    {:ok, node} = Node.get(:system, name: link_name, opts: [preload: :link])

    menu_id = UI.testid(["link-menu", Paths.link_id(node.link)])
    delete_id = UI.testid(["delete", Paths.link_id(node.link)])

    ctx
    |> UI.click(testid: menu_id)
    |> UI.click(testid: delete_id)
  end

  step :assert_link_content, ctx, attrs do
    {:ok, node} = Node.get(:system, name: attrs.title, type: :link, opts: [preload: :link])

    ctx
    |> UI.assert_page(Paths.link_path(ctx.company, node.link))
    |> UI.assert_text(attrs.title)
    |> UI.assert_text(attrs.url)
    |> UI.assert_text(attrs.notes)
  end

  defp assert_link_type(link_name, type) do
    {:ok, node} = Node.get(:system, name: link_name, type: :link, opts: [preload: :link])
    assert node.link.type == type
  end

  step :assert_link_is_airtable, ctx, title do
    assert_link_type(title, :airtable)

    ctx
  end

  step :assert_link_is_dropbox, ctx, title do
    assert_link_type(title, :dropbox)

    ctx
  end

  step :assert_link_is_figma, ctx, title do
    assert_link_type(title, :figma)

    ctx
  end

  step :assert_link_is_notion, ctx, title do
    assert_link_type(title, :notion)

    ctx
  end

  step :assert_link_is_google_doc, ctx, title do
    assert_link_type(title, :google_doc)

    ctx
  end

  step :assert_link_is_google_sheet, ctx, title do
    assert_link_type(title, :google_sheet)

    ctx
  end

  step :assert_link_is_google_slide, ctx, title do
    assert_link_type(title, :google_slides)

    ctx
  end

  step :assert_link_is_google, ctx, title do
    assert_link_type(title, :google)

    ctx
  end

  #
  # Feed
  #

  step :assert_link_created_on_space_feed, ctx, link_name do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("added a link: #{link_name}")
  end

  step :assert_link_created_on_company_feed, ctx, link_name do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("added a link to Documents & Files in the #{ctx.space.name} space: #{link_name}")
  end

  step :assert_link_edited_on_space_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("edited a link: #{attrs.title}")
    |> UI.assert_text("#{attrs.previous_title} → #{attrs.title}")
    |> UI.assert_text("#{attrs.previous_url} → #{attrs.url}")
  end

  step :assert_link_edited_on_company_feed, ctx, attrs do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("edited a link in the #{ctx.space.name} space: #{attrs.title}")
    |> UI.assert_text("#{attrs.previous_title} → #{attrs.title}")
    |> UI.assert_text("#{attrs.previous_url} → #{attrs.url}")
  end

  step :assert_link_deleted_on_space_feed, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("deleted the \"Link\" link from Documents & Files")
  end

  step :assert_link_deleted_on_company_feed, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("deleted the \"Link\" link from Documents & Files in the Product Space space")
  end

  #
  # Notifications
  #

  step :assert_link_created_notification_sent, ctx, link_name do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "added a link: #{link_name}",
    })
  end

  step :assert_link_edited_notification_sent, ctx, link_name do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "edited a link: #{link_name}",
    })
  end

  step :assert_link_deleted_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "deleted a link: Link",
    })
  end

  #
  # Emails
  #

  step :assert_link_created_email_sent, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "added a link",
      author: ctx.creator,
    })
  end

  step :assert_link_edited_email_sent, ctx, link_name do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "edited a link: #{link_name}",
      author: ctx.creator,
    })
  end

  step :assert_link_deleted_email_sent, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "deleted a link: Link",
      author: ctx.creator,
    })
  end
end
