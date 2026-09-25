defmodule Operately.Features.RichTextTablesTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.RichTextTablesSteps, as: Steps
  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Documents
  alias Operately.Support.Features.ResourceHubDocument.PublicSharingSteps, as: PublicSharing
  alias Operately.Support.Features.CompanyBillingRecoverySteps, as: Billing

  setup ctx, do: Steps.setup(ctx)

  feature "paste, save, reload and cancel document table edits", ctx do
    ctx
    |> Steps.edit_document()
    |> Steps.paste_table()
    |> Steps.save_document()
    |> Steps.reload_table()
    |> Steps.assert_document_version()
    |> Steps.edit_document()
    |> Steps.replace_text()
    |> Steps.cancel_document()
    |> Steps.reload_table()
  end

  feature "paste tables into descriptions and comments", ctx do
    ctx
    |> Steps.edit_description()
    |> Steps.paste_table()
    |> Steps.save_description()
    |> Steps.reload_table()
    |> Steps.open_comment()
    |> Steps.paste_table()
    |> Steps.save_comment()
    |> Steps.reload_table()
  end

  feature "viewers see tables without editor controls", ctx do
    ctx
    |> Steps.given_table_content()
    |> Steps.login_as_viewer()
    |> Steps.visit_document()
    |> Steps.assert_read_only()
    |> Steps.visit_project()
    |> Steps.assert_read_only()
  end

  feature "read-only companies retain table rendering without editing", ctx do
    ctx
    |> Steps.given_table_content()
    |> Billing.put_company_in_payment_recovery(:read_only)
    |> Steps.visit_document()
    |> Steps.assert_read_only()
    |> Steps.visit_project()
    |> Steps.assert_read_only()
  end

  feature "public documents render tables without editing", ctx do
    ctx
    |> Steps.given_table_content()
    |> PublicSharing.enable_sharing()
    |> PublicSharing.read_anonymously()
    |> Steps.assert_read_only()
  end

  feature "document history preserves and restores tables", ctx do
    ctx
    |> Steps.edit_document()
    |> Steps.paste_table()
    |> Steps.save_document()
    |> Steps.edit_document()
    |> Steps.replace_text()
    |> Steps.save_document()
    |> Documents.open_version_history()
    |> Documents.select_version_in_history(2)
    |> Steps.assert_read_only()
    |> Documents.restore_selected_version()
    |> Documents.assert_version_restored(2)
    |> Steps.visit_document()
    |> Steps.reload_table()
  end
end
