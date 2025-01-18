defmodule Operately.Support.Features.ResourceHubFileSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  def setup(ctx), do: Steps.setup(ctx)
  def visit_resource_hub_page(ctx), do: Steps.visit_resource_hub_page(ctx)
  def navigate_back(ctx, link), do: Steps.navigate_back(ctx, link)
  def assert_navigation_links(ctx, links), do: Steps.assert_navigation_links(ctx, links)
  def refute_navigation_links(ctx, links), do: Steps.refute_navigation_links(ctx, links)

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

  step :given_file_within_folder_exists, ctx do
    ctx =
      ctx
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)

    file = create_file(ctx, ctx.hub, ctx.folder.id)
    Map.put(ctx, :file, file)
  end

  step :given_file_exists, ctx do
    {:ok, hub} = ResourceHub.get(:system, space_id: ctx.space.id)

    file = create_file(ctx, hub)
    Map.put(ctx, :file, file)
  end

  step :visit_file_page, ctx do
    UI.visit(ctx, Paths.file_path(ctx.company, ctx.file))
  end

  #
  # Feed
  #

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

  step :assert_file_deleted_on_space_feed, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text("deleted \"Some File\" from Documents & Files")
  end

  step :assert_file_deleted_on_company_feed, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_text("deleted \"Some File\" from Documents & Files in the Product Space space")
  end

  #
  # Notifications
  #

  step :assert_file_commented_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "commented on: #{ctx.file.node.name}",
    })
  end

  step :assert_file_deleted_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.other_user)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "deleted a file: Some File",
    })
  end

  #
  # Emails
  #

  step :assert_file_commented_email_sent, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "commented on: #{ctx.file.node.name}",
      author: ctx.creator,
    })
  end

  step :assert_file_deleted_email_sent, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.other_user,
      action: "deleted a file: Some File",
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
          name: "Some File",
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
