defmodule Operately.Features.ResourceHubDocument.LiveUpdatesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Documents
  alias Operately.Support.Features.ResourceHubDocument.LiveUpdatesSteps, as: Steps
  alias Operately.Support.Features.ResourceHubSteps, as: Hub

  setup ctx, do: Documents.setup(ctx)

  feature "saved document updates preserve an unfinished comment and reader position", ctx do
    ctx
    |> Documents.given_document_within_resource_hub_root_exists()
    |> Documents.visit_document_page()
    |> Steps.start_comment()
    |> Hub.set_page_reload_marker()
    |> Steps.save_document_remotely()
    |> Steps.assert_updated_document_and_preserved_draft()
    |> Hub.assert_page_was_not_reloaded()
  end
end
