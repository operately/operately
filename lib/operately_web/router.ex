defmodule OperatelyWeb.Router do
  use OperatelyWeb, :router

  import OperatelyWeb.AccountAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {OperatelyWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_account
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :fetch_current_account
  end

  pipeline :graphql do
    plug OperatelyWeb.GraphQL.Context
    plug OperatelyWeb.GraphQL.QueryCounter
  end

  #
  # Account authentication and creation routes
  #
  scope "/", OperatelyWeb do
    pipe_through [:browser, :redirect_if_account_is_authenticated]

    get "/accounts/log_in", AccountSessionController, :new

    # In feature tests, we use the following route to log in as a user
    # during feature tests. The route is not available in production.
    #
    # The route accepts one query parameter, `email`, which is the
    # email address of the user to log in as.
    if Application.compile_env(:operately, :test_routes) do
      get "/accounts/auth/test_login", AccountOauthController, :test_login
    end
    if Application.compile_env(:operately, :dev_routes) do
      get "/accounts/auth/dev_login", AccountOauthController, :dev_login
    end
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser, :require_authenticated_account]

    get "/accounts/settings", AccountSettingsController, :edit
    put "/accounts/settings", AccountSettingsController, :update
    get "/accounts/settings/confirm_email/:token", AccountSettingsController, :confirm_email
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser]

    delete "/accounts/log_out", AccountSessionController, :delete
    get "/accounts/confirm", AccountConfirmationController, :new
    post "/accounts/confirm", AccountConfirmationController, :create
    get "/accounts/confirm/:token", AccountConfirmationController, :edit
    post "/accounts/confirm/:token", AccountConfirmationController, :update

    get "/accounts/auth/:provider", AccountOauthController, :request
    get "/accounts/auth/:provider/callback", AccountOauthController, :callback
  end

  scope "/api" do
    pipe_through [:api, :require_authenticated_account, :graphql]

    forward "/gql", Absinthe.Plug, schema: OperatelyWeb.Schema
  end

  if Application.compile_env(:operately, :dev_routes) do
    scope "/" do
      forward "/sent_emails", Bamboo.SentEmailViewerPlug
    end
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser, :require_authenticated_account]

    get "/*page", PageController, :index
  end

end
