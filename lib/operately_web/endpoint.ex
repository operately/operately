defmodule OperatelyWeb.Endpoint do
  use SiteEncrypt.Phoenix.Endpoint, otp_app: :operately

  # Allow running wallaby tests in parallel
  if sandbox = Application.compile_env(:operately, :sandbox) do
    IO.puts("Using sandbox: #{inspect(sandbox)}")
    plug Phoenix.Ecto.SQL.Sandbox, sandbox: sandbox
  end

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  # Set :encryption_salt if you would also like to encrypt it.
  @session_options [
    store: :cookie,
    key: "_operately_key",
    signing_salt: "ZnZTfVXw",
    same_site: "Lax"
  ]

  socket "/live", Phoenix.LiveView.Socket, websocket: [connect_info: [:user_agent, session: @session_options]]

  socket "/api/v2/subscriptions", OperatelyWeb.ApiSocket, websocket: true, longpoll: false

  # Serve at "/" the static files from "priv/static" directory.
  #
  # You should set gzip to true if you are running phx.digest
  # when deploying your static files in production.
  plug Plug.Static,
    at: "/",
    from: :operately,
    gzip: false,
    only: OperatelyWeb.static_paths()

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :operately
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options

  if Application.compile_env(:operately, :dev_routes) do
    plug :debug

    defp debug(conn, _) do
      Plug.Conn.register_before_send(conn, fn conn ->
        body = inspect(conn.resp_body)

        if String.contains?(body, "error") do
          IO.inspect(body, label: "GQL ERROR")
        end

        conn
      end)
    end
  end

  plug OperatelyWeb.Router

  alias OperatelyWeb.Certification, as: Cert

  @impl SiteEncrypt
  def certification do
    Cert.verify_config_presence()

    SiteEncrypt.configure(
      mode: Cert.mode(),
      client: :native,
      domains: [Cert.domain()],
      emails: Cert.emails(),
      db_folder: Cert.folder(),
      directory_url: Cert.directory_url()
    )
  end
end
