defmodule Operately.CliE2E.Documents.PublishDocumentTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.PublishDocumentSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents publish_document publishes a draft document", ctx do
    ctx
    |> Steps.create_draft_document()
    |> Steps.assert_document_is_draft()
    |> Steps.publish_document()
    |> Steps.assert_document_published()
  end
end
