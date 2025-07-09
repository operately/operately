defmodule OperatelyWeb.Api.Ai do
  defmodule Prompt do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    alias Operately.AI

    inputs do
      field? :prompt, :string, null: true
    end

    outputs do
      field? :result, :string, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.check_if_ai_enabled()
      |> run(:result, fn ctx -> {:ok, AI.run(ctx.me, inputs.prompt)} end)
      |> run(:serialized, fn ctx -> {:ok, %{result: ctx.result}} end)
      |> respond()
    end

    def respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :me, _} -> {:error, :unauthorized}
        {:error, :company, _} -> {:error, :not_found}
        {:error, :check_feature_enabled, error} -> {:error, %{message: error}}
        _ -> {:error, :internal_server_error}
      end
    end
  end

  defmodule Steps do
    use OperatelyWeb.Api.Helpers

    def start(conn) do
      %{conn: conn, me: find_me(conn)}
    end

    def check_feature_enabled(ctx) do
      company = Operately.Companies.get_company!(ctx.me.company_id)

      if "ai" in company.enabled_experimental_features do
        {:ok, true}
      else
        {:error, "AI Playground feature is not enabled for this company"}
      end
    end
  end
end
