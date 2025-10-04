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
      },
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
        },
        aiActions: ai_actions()
      })
      |> maybe_attach_support_session(conn)
    else
      config
    end
  end

  defp maybe_attach_support_session(config, conn) do
    case conn.assigns[:support_session] do
      %{company: company, person: person, started_at: started_at} ->
        Map.put(config, :supportSession, build_support_session_config(company, person, started_at))

      _ ->
        config
    end
  end

  defp build_support_session_config(company, person, started_at) do
    %{
      company: %{
        id: company.id,
        name: company.name,
        shortId: Operately.Companies.ShortId.encode!(company.short_id),
        path: OperatelyWeb.Paths.home_path(company)
      },
      person: %{
        id: person.id,
        fullName: person.full_name
      },
      startedAt: DateTime.to_iso8601(started_at),
      endPath: OperatelyWeb.Paths.to_url("/support/session/end")
    }
  end

  defp ai_actions do
    Operately.Ai.Prompts.actions()
    |> Enum.map(fn action ->
      %{
        id: action.id,
        label: action.label,
        context: action.context,
        experimental: action.experimental || false
      }
    end)
  end
end
