defmodule Operately.Support.CliE2E.Documents.PublishDocumentSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  alias Operately.ResourceHubs.Document

  step :setup, ctx do
    HubScopeSteps.setup_base(ctx)
  end

  step :create_draft_document, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI draft document",
        "--content",
        "Draft content",
        "--post-as-draft"
      ])

    payload = Jason.decode!(result.output)
    document_api_id = payload["document"]["id"]

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:document_api_id, document_api_id)
  end

  step :assert_document_is_draft, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    document = Document |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.document_api_id))
    assert document.state == :draft
    refute document.published_at

    ctx
  end

  step :publish_document, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "publish_document",
        "--document-id",
        ctx.document_api_id,
        "--content",
        "Published body"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_document_published, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    document =
      Document
      |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.document_api_id))
      |> Repo.preload(:node)

    text = document.content |> HubScopeSteps.collect_text() |> Enum.join(" ")

    assert document.state == :published
    assert document.published_at
    assert text =~ "Published body"

    ctx
  end
end
