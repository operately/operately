defmodule Operately.CliE2E.Documents.CreateTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.CreateSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents create_document uses the external defaults when optional flags are omitted", ctx do
    ctx
    |> Steps.create_document_with_defaults()
    |> Steps.assert_document_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "documents create_document uses explicit flags instead of the defaults", ctx do
    ctx
    |> Steps.create_document_with_overrides()
    |> Steps.assert_document_created_successfully()
    |> Steps.assert_overrides_were_applied()
  end
end
