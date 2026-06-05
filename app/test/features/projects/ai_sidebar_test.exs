defmodule Operately.Features.Projects.AiSidebarTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  describe "ai sidebar" do
    setup ctx do
      ctx =
        ctx
        |> Steps.create_project(name: "AI Project")
        |> Steps.login()

      previous = Application.get_env(:operately, :ai_configured)
      Application.put_env(:operately, :ai_configured, false)

      on_exit(fn ->
        Application.put_env(:operately, :ai_configured, previous)
      end)

      {:ok, ctx}
    end

    @tag login_as: :champion
    feature "shows a message when ai isn't configured", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.open_ai_sidebar()
      |> Steps.assert_ai_sidebar_disabled_message(message: "Ask Alfred isn't available because the AI integration hasn't been configured.")
    end
  end

  describe "ai sidebar when the feature is disabled" do
    setup ctx do
      ctx =
        ctx
        |> Steps.create_project(name: "AI Project")
        |> Factory.disable_feature("ai")
        |> Steps.login()

      previous = Application.get_env(:operately, :ai_configured)
      Application.put_env(:operately, :ai_configured, true)

      on_exit(fn ->
        Application.put_env(:operately, :ai_configured, previous)
      end)

      {:ok, ctx}
    end

    @tag login_as: :champion
    feature "is not displayed when ai isn't enabled for the company", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.assert_ai_sidebar_not_displayed()
    end
  end
end
