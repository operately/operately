defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  def index(conn, _params) do
    config = app_config(conn)

    conn
    |> assign(:app_config, config)
    |> assign(:vite_url, vite_url())
    |> render(:page)
  end

  def development_mode?(opts \\ []) do
    app_env = Keyword.get(opts, :app_env, Application.get_env(:operately, :app_env))
    ci = Keyword.get(opts, :ci, System.get_env("CI"))
    vite_available? = Keyword.get_lazy(opts, :vite_available?, &vite_available?/0)

    app_env == :dev or (app_env == :test and ci != "true" and vite_available?)
  end

  defp app_config(conn) do
    config = %{
      environment: Application.get_env(:operately, :app_env),
      baseUrl: OperatelyWeb.Endpoint.url(),
      demoBuilder: Application.get_env(:operately, :demo_builder_allowed),
      showDevBar: Application.get_env(:operately, :app_env) == :dev,
      configured: Operately.Setup.configured?(),
      allowLoginWithGoogle: Application.get_env(:operately, :allow_login_with_google),
      allowSignupWithGoogle: Application.get_env(:operately, :allow_signup_with_google),
      allowLoginWithEmail: Application.get_env(:operately, :allow_login_with_email),
      allowSignupWithEmail: Application.get_env(:operately, :allow_signup_with_email),
      version: Operately.version(),
      sentry: %{
        enabled: Application.get_env(:operately, :js_sentry_enabled),
        dsn: Application.get_env(:operately, :js_sentry_dsn)
      },
      billingEnabled: Application.get_env(:operately, :billing_enabled, false),
      discordUrl: "https://discord.com/invite/2ngnragJYV",
      bookDemoUrl: "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3aS205iUzxYTRPq0sO1fVMbTobKXWGpKxSp26XkALJFnx3LzfB9gcWKQ0kAmj2JoERc0CX70Hg"
    }

    if conn.assigns.current_account do
      Map.merge(config, %{
        api: %{
          socketToken: OperatelyWeb.ApiSocket.gen_token(conn)
        },
        account: %{
          id: conn.assigns.current_account.id
        }
      })
    else
      config
    end
  end

  defp vite_url do
    "http://localhost:#{vite_port()}"
  end

  defp vite_port do
    offset = System.get_env("PORT_OFFSET") || "4000"
    String.to_integer(offset) + 5
  end

  defp vite_available? do
    case :gen_tcp.connect(~c"127.0.0.1", vite_port(), [:binary, active: false], 200) do
      {:ok, socket} ->
        :gen_tcp.close(socket)
        true

      {:error, _} ->
        false
    end
  end
end
