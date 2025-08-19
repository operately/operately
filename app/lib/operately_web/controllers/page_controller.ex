defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  def index(conn, _params) do
    config = app_config(conn)

    conn |> assign(:app_config, config) |> render(:page)
  end

  def development_mode? do
    Application.get_env(:operately, :app_env) == :dev or (Application.get_env(:operately, :app_env) == :test and System.get_env("CI") != "true")
  end

  defp app_config(conn) do
    config = %{
      environment: Application.get_env(:operately, :app_env),
      demoBuilder: Application.get_env(:operately, :demo_builder_allowed),
      showDevBar: Application.get_env(:operately, :app_env) == :dev,
      configured: Operately.Companies.count_companies() > 0,
      allowLoginWithGoogle: Application.get_env(:operately, :allow_login_with_google),
      allowSignupWithGoogle: Application.get_env(:operately, :allow_signup_with_google),
      allowLoginWithEmail: Application.get_env(:operately, :allow_login_with_email),
      allowSignupWithEmail: Application.get_env(:operately, :allow_signup_with_email),
      version: Operately.version(),
      sentry: %{
        enabled: Application.get_env(:operately, :js_sentry_enabled),
        dsn: Application.get_env(:operately, :js_sentry_dsn)
      }
    }

    if conn.assigns.current_account do
      Map.merge(config, %{
        api: %{
          socketToken: OperatelyWeb.ApiSocket.gen_token(conn)
        },
        account: %{
          id: conn.assigns.current_account.id
        },
        aiActions: ai_actions()
      })
    else
      config
    end
  end

  defp ai_actions do
    Operately.Ai.Prompts.actions()
    |> Enum.map(fn action ->
      %{
        id: action.id,
        label: action.label,
        context: action.context
      }
    end)
  end
end
