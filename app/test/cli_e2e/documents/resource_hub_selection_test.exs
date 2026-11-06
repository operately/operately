defmodule Operately.CliE2E.Documents.ResourceHubSelectionTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.ResourceHubSelectionSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "discovers hubs, writes to a selected hub, and preserves space-only defaults", ctx do
    ctx
    |> Steps.discover_hubs()
    |> Steps.create_and_list_folder_in_selected_hub()
    |> Steps.assert_space_uses_default_hub()
  end

  test "an unavailable default returns candidates that can be used to retry", ctx do
    ctx
    |> Steps.unset_default_hub()
    |> Steps.assert_error_and_select_candidate()
    |> Steps.create_and_list_folder_in_selected_hub()
  end

  test "manages collection lifecycle without losing content or defaults", ctx do
    ctx
    |> Steps.create_collection()
    |> Steps.rename_collection()
    |> Steps.add_folder_to_collection()
    |> Steps.assert_default_collection_cannot_be_deleted()
    |> Steps.assert_nonempty_collection_cannot_be_deleted()
    |> Steps.delete_collection_folder()
    |> Steps.delete_collection()
    |> Steps.assert_collection_deleted_and_default_preserved()
  end
end
