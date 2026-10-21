defmodule OperatelyWeb.Api.Internal do
  use TurboConnect.Api

  defdelegate prepare_inputs(conn, inputs), to: OperatelyWeb.Api.RichContent.Preparation
  defdelegate prepare_response(conn, response), to: OperatelyWeb.Api.RichContent.Preparation

  plug OperatelyWeb.Api.Plugs.PublicDocumentHeaders

  @public_endpoints [
    {:mutation, "analytics/sync_context"},
    {:query, "get_language"},
    {:query, "documents/get_public"},
    {:query, "curated_templates/list"},
    {:query, "curated_templates/get"},
    {:query, "curated_templates/get_by_id"},
    {:mutation, "add_first_company"},
    {:mutation, "join_company"},
    {:mutation, "cli_auth/auth_password"},
    {:mutation, "cli_auth/request_email_code"},
    {:mutation, "cli_auth/auth_email_code"},
    {:mutation, "cli_auth/start_google"},
    {:mutation, "cli_auth/start_google_signup"},
    {:mutation, "cli_auth/create_token"},
    {:mutation, "cli_auth/check_account"},
    {:mutation, "cli_auth/signup"},
    {:query, "cli_auth/company_creation_status"},
    {:mutation, "cli_auth/setup_company"},
    {:mutation, "cli_auth/create_company"},
    {:mutation, "cli_auth/join_company"},
    {:mutation, "cli_auth/join_with_invite"},
    {:mutation, "create_email_activation_code"},
    {:mutation, "create_account"},
    {:mutation, "request_password_reset"},
    {:mutation, "reset_password"},
    {:query, "cli_auth/status"},

    # must be public to allow lookup by token
    {:query, "invitations/get_invitation"},
    {:query, "invitations/get_invite_link_by_token"},
    {:query, "invitations/get_invite_link_availability"},

    # get_theme is called when the app loads, including on pages such as /login and /sign-up,
    # so it's public to avoid returning 401. If there isn't an account logged-in, the query
    # returns the default theme: "system".
    {:query, "get_theme"}
  ]

  # These authenticated endpoints operate on the account or select/create a company.
  @account_endpoints [
    {:query, "people/get_account"},
    {:query, "companies/list"},
    {:query, "billing/get_catalog"},
    {:query, "email_changes/get"},
    {:query, "company_transfers/get_import_run"},
    {:query, "company_transfers/list_import_runs"},
    {:mutation, "companies/create"},
    {:mutation, "change_password"},
    {:mutation, "people/update_theme"},
    {:mutation, "email_changes/request"},
    {:mutation, "email_changes/verify_current"},
    {:mutation, "email_changes/resend"},
    {:mutation, "email_changes/confirm"},
    {:mutation, "email_changes/cancel"},
    {:mutation, "invitations/join_company_via_invite_link"},
    {:mutation, "company_transfers/create_import_artifact_blobs"},
    {:mutation, "company_transfers/start_import"},
    {:mutation, "mark_blob_uploaded"}
  ]

  plug OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount, except: @public_endpoints
  plug OperatelyWeb.Api.Plugs.RequireCompanyContext, except: @public_endpoints ++ @account_endpoints

  plug(OperatelyWeb.Api.Plugs.RequireCliAuthSession,
    only: [
      {:query, "cli_auth/status"},
      {:mutation, "cli_auth/setup_company"},
      {:mutation, "cli_auth/create_token"},
      {:mutation, "cli_auth/create_company"},
      {:mutation, "cli_auth/join_with_invite"}
    ]
  )

  use_types(OperatelyWeb.Api.Types)

  import OperatelyWeb.Api

  internal_endpoints()
end
