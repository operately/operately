defmodule Operately.Features.ResourceHubDocument.VersionHistoryTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @document %{
    name: "Versioned Doc",
    content: "First body"
  }

  feature "editor opens history and compares adjacent versions", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.edit_document(%{name: "Versioned Doc", content: "Second body"})
    |> Steps.edit_document(%{name: "Versioned Doc v3", content: "Third body"})
    |> Steps.open_version_history()
    |> Steps.assert_on_version_history_page()
    |> Steps.open_version_comparison(3)
    |> Steps.assert_comparing_versions({2, 3})
  end

  feature "editor restores an earlier version from history", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.edit_document(%{name: "Versioned Doc", content: "Second body"})
    |> Steps.open_version_history()
    |> Steps.assert_on_version_history_page()
    |> Steps.select_version_in_history(1)
    |> Steps.restore_selected_version()
    |> Steps.assert_version_restored(1)
  end

  feature "stale restore shows a conflict and keeps history intact", ctx do
    ctx =
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.edit_document(%{name: "Versioned Doc", content: "Second body"})
      |> Steps.open_version_history()
      |> Steps.assert_on_version_history_page()
      |> Steps.select_version_in_history(1)

    {:ok, document} = Operately.ResourceHubs.Document.get(:system, id: ctx.document.id, opts: [preload: [:resource_hub, :node]])

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Versioned Doc concurrent",
        content: Operately.Support.RichText.rich_text("Concurrent body")
      })

    ctx
    |> Steps.restore_selected_version()
    |> Steps.assert_restore_conflict()
  end

  feature "users without document view access cannot open version history", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:outsider)
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)

    ctx
    |> UI.login_as(ctx.outsider)
    |> Steps.assert_version_history_forbidden()
  end

  feature "viewer can open history but cannot restore", ctx do
    ctx =
      ctx
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.edit_document(%{name: "Versioned Doc", content: "Second body"})

    ctx
    |> UI.login_as(ctx.viewer)
    |> Steps.open_version_history()
    |> Steps.assert_on_version_history_page()
    |> Steps.select_version_in_history(1)
    |> Steps.refute_restore_action()
  end
end
