defmodule Operately.Support.Features.DiscussionSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI

  step :start_writting_discussion, ctx, params do
    ctx
    |> UI.visit("/spaces/#{ctx.space.id}/discussions")
    |> UI.click(testid: "new-discussion")
    |> UI.assert_page("/spaces/#{ctx.space.id}/discussions/new")
    |> UI.fill(testid: "discussion-title", with: params[:title])
  end

  step :attach_file_to_discussion, ctx do
    # There is no direct way to interact with the file input field in Wallaby
    # so as a workaround, we do two implicit tests:
    #
    # 1. we trigger the click event on the input field, and test if a test flag was set.
    # 2. we upload a file by typing the path in the input field.
    #

    # The file path is based on where the app is running inside of docker.
    # The assumption is the project is mounted at /home/dev/app and that we can access README.md.

    ctx
    |> UI.click(testid: "toolbar-button-add-an-image-or-file")
    |> UI.assert_has(Wallaby.Query.css("[data-test-upload-triggered=true]", visible: false))
    |> UI.upload_file(testid: "attachment-input-field", path: "/home/dev/app/README.md")
  end

  step :assert_file_is_added, ctx do
    ctx |> UI.assert_text("README.md")
  end

  step :submit_discussion, ctx do
    ctx |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_is_posted_with_attachment, ctx do
    discussion = last_discussion(ctx)

    ctx
    |> UI.assert_page("/spaces/#{ctx.space.id}/discussions/#{discussion.id}")
    |> UI.assert_text("Testing file attachment")
    |> UI.assert_text("README.md")
  end

  #
  # Utilities
  #

  defp last_discussion(ctx) do
    discussions = Operately.Updates.list_updates(ctx.space.id, :space, :project_discussion) 

    if discussions != [] do
      hd(discussions)
    else
      # sometimes the updates are not immediately available
      # so we wait a bit and try again
      :timer.sleep(300)
      Operately.Updates.list_updates(ctx.space.id, :space, :project_discussion) |> hd()
    end
  end
end
