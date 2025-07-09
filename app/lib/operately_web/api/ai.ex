defmodule OperatelyWeb.Api.Ai do
  alias __MODULE__.Steps

  defmodule Prompt do
    use TurboConnect.Query

    inputs do
      field :prompt, :string
    end

    outputs do
      field :result, :string
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.check_if_ai_enabled()
      |> Steps.run_prompt(inputs.prompt)
      |> Steps.respond(fn _ -> %{result: ctx.result} end)
    end
  end

  defmodule Steps do
    use OperatelyWeb.Api.Helpers

    def start(conn) do
      %{conn: conn, me: find_me(conn)}
    end

    def run_prompt(ctx, prompt) do
      Map.put(ctx, :result, Operately.AI.run(ctx.me, prompt))
    end

    def check_feature_enabled(ctx) do
      company = Operately.Companies.get_company!(ctx.me.company_id)

      if "ai" in company.enabled_experimental_features do
        {:ok, true}
      else
        {:error, "AI Playground feature is not enabled for this company"}
      end
    end

    def respond(result, ok_callback, error_callback \\ &handle_error/1) do
      case result do
        {:ok, changes} ->
          {:ok, ok_callback.(changes)}

        {:error, _, :idempotent, changes} ->
          {:ok, ok_callback.(changes)}

        e ->
          error_callback.(e)
      end
    end

    defp handle_error(reason) do
      case reason do
        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Transaction failed: #{inspect(reason)}")
          {:error, :internal_server_error}

        e ->
          Logger.error("Unexpected error: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end
end
