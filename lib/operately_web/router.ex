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
    plug OperatelyWeb.Graphql.Context
  end

  #
  # Account authentication and creation routes
  #
  scope "/", OperatelyWeb do
    pipe_through [:browser, :redirect_if_account_is_authenticated]

    get "/accounts/log_in", AccountSessionController, :new

    #
    # In development, we use the following route to log in as a user
    # during development. The route is not available in production.
    #
    if Application.compile_env(:operately, :dev_routes) do
      post "/accounts/log_in", AccountSessionController, :create
    end

    #
    # In feature tests, we use the following route to log in as a user
    # during feature tests. The route is not available in production.
    #
    # The route accepts one query parameter, `email`, which is the
    # email address of the user to log in as.
    #
    if Application.compile_env(:operately, :test_routes) do
      get "/accounts/auth/test_login", AccountTestSessionController, :test_login
    end
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser, :require_authenticated_account]

    get "/blobs/:id", BlobController, :get
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser]

    delete "/accounts/log_out", AccountSessionController, :delete
    get "/accounts/auth/:provider", AccountOauthController, :request
    get "/accounts/auth/:provider/callback", AccountOauthController, :callback
  end

  forward "/media", OperatelyLocalMediaStorage.Plug

  scope "/api" do
    pipe_through [:api, :graphql]

    forward "/gql", Absinthe.Plug, schema: OperatelyWeb.Graphql.Schema
  end

  scope "/api" do
    pipe_through [:api]

    forward "/v2", OperatelyWeb.Api
  end

  if Application.compile_env(:operately, :dev_routes) do
    scope "/" do
      forward "/sent_emails", Bamboo.SentEmailViewerPlug
    end
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser]

    get "/*page", PageController, :index
  end
end
