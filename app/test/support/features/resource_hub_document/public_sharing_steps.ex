defmodule Operately.Support.Features.ResourceHubDocument.PublicSharingSteps do
  use Operately.FeatureCase

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub,
        state: :published,
        name: "Consultant briefing",
        content: Operately.Support.RichText.rich_text("Our priorities for the next quarter: review the onboarding experience, identify opportunities to simplify setup, and propose a plan for the next release.")
      )

    UI.login_as(ctx, ctx.creator)
  end

  step :enable_sharing, ctx do
    ctx =
      ctx
      |> UI.visit(Paths.document_path(ctx.company, ctx.document))
      |> UI.click(testid: "options-button")
      |> UI.assert_has(Wallaby.Query.css("[data-test-id='share-document-publicly']", text: "Share publicly"))
      |> UI.click(testid: "share-document-publicly")
      |> UI.click(testid: "enable-public-sharing")
      |> UI.assert_has(testid: "public-document-url")
      |> UI.take_screenshot()

    document = Operately.Repo.reload!(ctx.document)
    Map.put(ctx, :public_path, "/public/documents/" <> document.public_token)
  end

  step :read_anonymously, ctx do
    ctx
    |> UI.logout()
    |> UI.visit(ctx.public_path)
    |> UI.assert_has(testid: "public-document-page")
    |> UI.refute_has(testid: "options-button")
    |> UI.refute_has(testid: "navigation")
    |> UI.take_screenshot()
  end

  step :disable_sharing, ctx do
    ctx
    |> UI.login_as(ctx.creator)
    |> UI.visit(Paths.document_path(ctx.company, ctx.document))
    |> UI.click(testid: "options-button")
    |> UI.assert_has(Wallaby.Query.css("[data-test-id='share-document-publicly']", text: "Manage public sharing"))
    |> UI.click(testid: "share-document-publicly")
    |> UI.click(testid: "disable-public-sharing")
    |> UI.assert_has(testid: "enable-public-sharing")
  end

  step :assert_link_unavailable, ctx do
    ctx
    |> UI.logout()
    |> UI.visit(ctx.public_path)
    |> UI.assert_has(testid: "public-document-unavailable")
    |> UI.refute_has(testid: "public-document-page")
  end
end
