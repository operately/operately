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
      |> Steps.verify_feature_enabled()
      |> Steps.run_prompt(inputs.prompt)
      |> Steps.respond(fn ctx -> %{result: ctx.result} end)
    end
  end

  defmodule AddAgent do
    use TurboConnect.Mutation

    inputs do
      field :title, :string
      field :full_name, :string
      field :definition, :string
    end

    outputs do
      field :person, :person
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.add_agent(inputs.title, inputs.full_name, inputs.definition)
      |> Steps.respond(fn ctx -> %{person: Serializers.serialize(ctx.person, :full)} end)
    end
  end

  defmodule Steps do
    use OperatelyWeb.Api.Helpers

    def start(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.put(:me, find_me(conn))
    end

    def run_prompt(multi, prompt) do
      Ecto.Multi.run(multi, :result, fn _repo, %{me: me} ->
        Operately.AI.run(me, prompt)
      end)
    end

    def add_agent(multi, title, full_name, definition) do
      Ecto.Multi.run(multi, :person, fn _repo, %{me: me} ->
        Operately.Operations.AgentAdding.run(me, %{
          title: title,
          full_name: full_name,
          definition: definition
        })
      end)
    end

    def verify_feature_enabled(ctx) do
      Ecto.Multi.run(ctx, :feature_enabled?, fn _repo, _changes ->
        company = Operately.Companies.get_company!(ctx.me.company_id)

        if "ai" in company.enabled_experimental_features do
          {:ok, true}
        else
          {:error, "AI is not enabled for this company"}
        end
      end)
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
