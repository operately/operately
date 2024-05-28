defmodule OperatelyWeb.Endpoint do
  use SiteEncrypt.Phoenix.Endpoint, otp_app: :operately
  use Absinthe.Phoenix.Endpoint

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

  socket "/api/graphql-ws", OperatelyWeb.GraphqlWSSocket,
    websocket: [path: "", subprotocols: ["graphql-transport-ws"]]

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

  @impl SiteEncrypt
  def certification do
    SiteEncrypt.configure(
      # Note that native client is very immature. If you want a more stable behaviour, you can
      # provide `:certbot` instead. Note that in this case certbot needs to be installed on the
      # host machine.
      client: :native,

      domains: ["mysite.com", "www.mysite.com"],
      emails: ["contact@abc.org", "another_contact@abc.org"],

      # By default the certs will be stored in tmp/site_encrypt_db, which is convenient for
      # local development. Make sure that tmp folder is gitignored.
      #
      # Set OS env var SITE_ENCRYPT_DB on staging/production hosts to some absolute path
      # outside of the deployment folder. Otherwise, the deploy may delete the db_folder,
      # which will effectively remove the generated key and certificate files.
      db_folder:
        System.get_env("SITE_ENCRYPT_DB", Path.join("tmp", "site_encrypt_db")),

      # set OS env var CERT_MODE to "staging" or "production" on staging/production hosts
      directory_url:
        case System.get_env("CERT_MODE", "local") do
          "local" -> {:internal, port: 4002}
          "staging" -> "https://acme-staging-v02.api.letsencrypt.org/directory"
          "production" -> "https://acme-v02.api.letsencrypt.org/directory"
        end
    )
  end
end
