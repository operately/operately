defmodule Operately.Features.ResourceHubSearchTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSearchSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "searches a nested document by its body and navigates to it", ctx do
    ctx
    |> Steps.visit_resource_hub()
    |> Steps.search_for("approval workflow")
    |> Steps.assert_document_result()
    |> Steps.open_document_result()
    |> Steps.assert_document_page()
  end
end
