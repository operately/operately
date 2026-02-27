defmodule OperatelyWeb.Api.Internal do
  use TurboConnect.Api

  plug(OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount,
    except: [
      {:mutation, "add_first_company"},
      {:mutation, "join_company"},
      {:mutation, "create_email_activation_code"},
      {:mutation, "create_account"},
      {:mutation, "request_password_reset"},
      {:mutation, "reset_password"},

      # must be public to allow lookup by token
      {:query, "invitations/get_invitation"},
      {:query, "invitations/get_invite_link_by_token"},

      # get_theme is called when the app loads, including on pages such as /login and /sign-up,
      # so it's public to avoid returning 401. If there isn't an account logged-in, the query
      # returns the default theme: "system".
      {:query, "get_theme"}
    ]
  )

  use_types(OperatelyWeb.Api.Types)

  import OperatelyWeb.Api

  internal_endpoints()
end
