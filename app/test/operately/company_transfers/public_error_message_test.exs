defmodule Operately.CompanyTransfers.PublicErrorMessageTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.{ExportRun, ImportRun, PublicErrorMessage}

  test "maps import validation errors to public messages and deduplicates them" do
    reason =
      {:validation_failed, "raw validation message", [
        %{"code" => "duplicate_account_emails"},
        %{"code" => "invalid_goal_update_authors"},
        %{"code" => "file_count_mismatch"},
        %{"code" => "file_count_mismatch"}
      ]}

    assert PublicErrorMessage.for_import(reason) ==
             "This package contains duplicate email addresses and can't be imported until that is fixed. " <>
               "This export package is missing some people data and can't be imported. " <>
               "This ZIP file looks incomplete or damaged. Export the company again and try again."
  end

  test "uses the generic import fallback for unexpected failures" do
    assert PublicErrorMessage.for_import({:missing_reference_translation, "projects", "space_id", "spaces", "source-id"}) ==
             "We couldn't import this company. Please try again with a new export package. If it keeps failing, contact support."
  end

  test "uses the generic export fallback for unexpected failures" do
    assert PublicErrorMessage.for_export({:no_company_path, "projects"}) ==
             "We couldn't create the export package. Please try again. If it keeps failing, contact support."
  end

  test "prefers validation errors when sanitizing failed import runs" do
    run = %ImportRun{
      status: :failed,
      error_message: "Missing reference translation for projects.space_id -> spaces (source-id)",
      validation_errors: [%{"code" => "duplicate_account_emails"}]
    }

    assert PublicErrorMessage.for_import(run) ==
             "This package contains duplicate email addresses and can't be imported until that is fixed."
  end

  test "sanitizes pre-existing raw run error messages" do
    import_run = %ImportRun{status: :failed, error_message: "Archive does not contain data.json", validation_errors: []}
    export_run = %ExportRun{status: :failed, error_message: "Company not found"}

    assert PublicErrorMessage.for_import(import_run) ==
             "This ZIP file looks incomplete or damaged. Export the company again and try again."

    assert PublicErrorMessage.for_export(export_run) == "This company is no longer available to export."
  end
end
