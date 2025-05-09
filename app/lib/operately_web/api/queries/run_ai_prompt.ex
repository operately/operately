defmodule OperatelyWeb.Api.Queries.RunAiPrompt do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.AI

  inputs do
    field :prompt, :string
  end

  outputs do
    field :result, :string
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:check_feature_enabled, fn ctx ->
      if "ai_playground" in company(ctx).enabled_experimental_features do
        {:ok, true}
      else
        {:error, "AI Playground feature is not enabled for this company"}
      end
    end)
    |> run(:result, fn ctx ->
      result = AI.run(ctx.me, inputs.prompt)
      {:ok, result}
    end)
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
