defmodule OperatelyWeb.Api.Internal do
  use TurboConnect.Api

  plug(OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount,
    except: [
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
  )

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
