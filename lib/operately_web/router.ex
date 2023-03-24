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
  end

  #
  # Account authentication and creation routes
  #
  scope "/", OperatelyWeb do
    pipe_through [:browser, :redirect_if_account_is_authenticated]

    get "/accounts/log_in", AccountSessionController, :new
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser, :require_authenticated_account]

    get "/accounts/settings", AccountSettingsController, :edit
    put "/accounts/settings", AccountSettingsController, :update
    get "/accounts/settings/confirm_email/:token", AccountSettingsController, :confirm_email
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser]

    # In Wallaby, we use the following route to log in as a user
    # during feature tests. The route is not available in production.
    #
    # The route accepts one query parameter, `email`, which is the
    # email address of the user to log in as.
    if Application.compile_env(:operately, :test_routes) do
      get "/accounts/auth/test_login", AccountOauthController, :test_login
    end

    delete "/accounts/log_out", AccountSessionController, :delete
    get "/accounts/confirm", AccountConfirmationController, :new
    post "/accounts/confirm", AccountConfirmationController, :create
    get "/accounts/confirm/:token", AccountConfirmationController, :edit
    post "/accounts/confirm/:token", AccountConfirmationController, :update

    get "/accounts/auth/:provider", AccountOauthController, :request
    get "/accounts/auth/:provider/callback", AccountOauthController, :callback
  end

  scope "/", OperatelyWeb do
    pipe_through [:browser, :require_authenticated_account]

    get "/", PageController, :home

    resources "/people", PersonController

    resources "/tenets", TenetController
    resources "/kpis", KpiController
    resources "/projects", ProjectController

    resources "/groups", GroupController do
      get "/people_search", GroupController, :people_search
      post "/add_people", GroupController, :add_people
      get "/members", GroupController, :members
    end

    resources "/objectives", ObjectiveController do
      resources "/key_results", KeyResultController, except: [:index]
    end
  end

  # Other scopes may use custom stacks.
  # scope "/api", OperatelyWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:operately, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: OperatelyWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

end
