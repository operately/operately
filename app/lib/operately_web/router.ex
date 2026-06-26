defmodule OperatelyWeb.Router do
  use OperatelyWeb, :router

  import OperatelyWeb.AccountAuth

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
    plug(:fetch_current_account)
    plug(:fetch_current_company)
    plug(:fetch_current_person)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:fetch_current_account)
    plug(:fetch_current_company)
    plug(:fetch_current_person)
  end

  pipeline :api_external do
    plug(:accepts, ["json"])
  end

  pipeline :mcp_discovery do
    plug OperatelyWeb.Mcp.Plugs.Cors
  end

  pipeline :mcp do
    plug OperatelyWeb.Mcp.Plugs.Cors
    plug OperatelyWeb.Mcp.Plugs.ValidateOrigin
    plug OperatelyWeb.Mcp.Plugs.RequireMcpAuth
    plug OperatelyWeb.Mcp.Plugs.ResolveCompany
  end

  #
  # Health check endpoint
  #
  scope "/health", OperatelyWeb do
    get("/", HealthController, :index)
  end

  #
  # Account authentication and creation routes
  #
  scope "/", OperatelyWeb do
    pipe_through([:browser, :redirect_if_account_is_authenticated])

    post("/accounts/log_in", AccountSessionController, :create)

    #
    # In feature tests, we use the following route to log in as a user
    # during feature tests. The route is not available in production.
    #
    # The route accepts one query parameter, `email`, which is the
    # email address of the user to log in as.
    #
    if Application.compile_env(:operately, :test_routes) do
      get("/accounts/auth/test_login", AccountSessionController, :test_login)
      get("/accounts/auth/test_google", AccountOauthController, :test_google)
    end
  end

  scope "/", OperatelyWeb do
    pipe_through([:browser, :require_authenticated_account])

    get("/blobs/:id", BlobController, :get)
  end

  scope "/:company_id/exports/markdown", OperatelyWeb do
    pipe_through([:browser, :require_authenticated_account])

    get("/projects/:id", MarkdownExportController, :project)
    get("/goals/:id", MarkdownExportController, :goal)
  end

  scope "/", OperatelyWeb do
    pipe_through([:browser])

    delete("/accounts/log_out", AccountSessionController, :delete)

    get("/cli-login/:id", CliLoginController, :show)
    get("/cli-login/:id/success", CliLoginController, :success)

    get("/accounts/auth/:provider", AccountOauthController, :request)
    get("/accounts/auth/:provider/callback", AccountOauthController, :callback)

    get("/oauth/authorize", McpOAuthController, :authorize)
    post("/oauth/authorize", McpOAuthController, :submit_authorization)
  end

  scope "/", OperatelyWeb do
    pipe_through(:mcp_discovery)

    get("/.well-known/oauth-protected-resource", McpMetadataController, :protected_resource)
    options("/.well-known/oauth-protected-resource", McpMetadataController, :cors_preflight)
    get("/.well-known/oauth-protected-resource/mcp", McpMetadataController, :protected_resource)
    options("/.well-known/oauth-protected-resource/mcp", McpMetadataController, :cors_preflight)

    get("/.well-known/oauth-authorization-server", McpMetadataController, :authorization_server)
    options("/.well-known/oauth-authorization-server", McpMetadataController, :cors_preflight)
    get("/.well-known/oauth-authorization-server/mcp", McpMetadataController, :authorization_server)
    options("/.well-known/oauth-authorization-server/mcp", McpMetadataController, :cors_preflight)

    get("/.well-known/openid-configuration", McpMetadataController, :openid_configuration)
    options("/.well-known/openid-configuration", McpMetadataController, :cors_preflight)
    get("/.well-known/openid-configuration/mcp", McpMetadataController, :openid_configuration)
    options("/.well-known/openid-configuration/mcp", McpMetadataController, :cors_preflight)

    post("/oauth/token", McpOAuthController, :token)
  end

  scope "/", OperatelyWeb do
    pipe_through([:mcp])

    post("/mcp", McpController, :post)
    get("/mcp", McpController, :get)
    delete("/mcp", McpController, :delete)
    options("/mcp", McpController, :cors_preflight)
  end

  scope "/billing", OperatelyWeb do
    pipe_through([:browser, :require_authenticated_account])

    get("/pick-company", PageController, :index)
  end

  scope "/billing", OperatelyWeb do
    pipe_through([:browser])

    get("/intent", BillingIntentController, :index)
  end

  forward("/media", OperatelyLocalMediaStorage.Plug)

  scope "/admin/api" do
    pipe_through([:api])

    # Support session management
    post "/support-session/start", OperatelyEE.Controllers.SupportSessionController, :start
    post "/support-session/end", OperatelyEE.Controllers.SupportSessionController, :end_session

    forward("/v1", OperatelyEE.AdminApi)
  end

  scope "/api/external" do
    pipe_through([:api_external])

    forward("/v1", OperatelyWeb.Api.External)
  end

  scope "/webhooks", OperatelyWeb do
    pipe_through([:api_external])

    post("/polar", PolarWebhookController, :create)
  end

  scope "/api" do
    pipe_through([:api])

    forward("/v2", OperatelyWeb.Api.Internal)
  end

  scope "/analytics/beacons" do
    forward("/", OperatelyEE.BeaconCollector)
  end

  if Application.compile_env(:operately, :dev_routes) do
    scope "/" do
      pipe_through(:browser)
      forward("/dev/mailbox", Plug.Swoosh.MailboxPreview)
      forward("/dev/emails", OperatelyWeb.EmailPreview)
    end
  end

  scope "/", OperatelyWeb do
    pipe_through([:browser])

    get("/*page", PageController, :index)
  end
end
