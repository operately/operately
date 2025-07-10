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

  defmodule GetAgent do
    use TurboConnect.Query
    alias OperatelyWeb.Api.Serializer

    inputs do
      field :id, :id
    end

    outputs do
      field :agent, :person
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Steps.respond(fn res -> %{agent: Serializer.serialize(res.agent, level: :full)} end)
    end
  end

  defmodule ListAgents do
    use TurboConnect.Query
    alias OperatelyWeb.Api.Serializer

    inputs do
    end

    outputs do
      field :agents, list_of(:person)
    end

    def call(conn, _inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.list_agents()
      |> Steps.respond(fn res -> %{agents: Serializer.serialize(res.agents, level: :full)} end)
    end
  end

  defmodule AddAgent do
    use TurboConnect.Mutation

    inputs do
      field :title, :string
      field :full_name, :string
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.add_agent(inputs.title, inputs.full_name)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule Steps do
    require Logger
    use OperatelyWeb.Api.Helpers

    def start(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.put(:me, conn.assigns.current_person)
    end

    def get_agent(multi, id) do
      import Ecto.Query, only: [from: 2]

      Ecto.Multi.run(multi, :agent, fn _repo, %{me: me} ->
        Operately.Repo.one(
          from(p in Operately.People.Person,
            where: p.id == ^id and p.company_id == ^me.company_id and not p.suspended and p.type == :ai,
            preload: [:agent_def]
          )
        )
        |> case do
          nil -> {:error, :not_found}
          agent -> {:ok, agent}
        end
      end)
    end

    def list_agents(multi) do
      Ecto.Multi.run(multi, :agents, fn _repo, %{me: me} ->
        {:ok, Operately.People.list_agents(me.company_id)}
      end)
    end

    def run_prompt(multi, prompt) do
      Ecto.Multi.run(multi, :result, fn _repo, %{me: me} ->
        Operately.AI.run(me, prompt)
      end)
    end

    def add_agent(multi, title, full_name) do
      Ecto.Multi.run(multi, :person, fn _repo, %{me: me} ->
        Operately.Operations.AgentAdding.run(me, %{title: title, full_name: full_name})
      end)
    end

    def verify_feature_enabled(multi) do
      Ecto.Multi.run(multi, :feature_enabled?, fn _repo, %{me: me} ->
        company = Operately.Companies.get_company!(me.company_id)

        if "ai" in company.enabled_experimental_features do
          {:ok, true}
        else
          {:error, :not_found}
        end
      end)
    end

    def respond(multi, ok_callback, error_callback \\ &handle_error/1) do
      case Operately.Repo.transaction(multi) do
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
