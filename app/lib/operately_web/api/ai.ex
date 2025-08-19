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

  defmodule EditAgentDefinition do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :definition, :string
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{definition: inputs.definition})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule EditAgentTaskExecutionInstructions do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :instructions, :string
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{task_execution_instructions: inputs.instructions})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule EditAgentPlanningInstructions do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :instructions, :string
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{planning_instructions: inputs.instructions})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule EditAgentSandboxMode do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :mode, :boolean
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{sandbox_mode: inputs.mode})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule EditAgentDailyRun do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :enabled, :boolean
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{daily_run: inputs.enabled})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule EditAgentVerbosity do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :verbose, :boolean
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{verbose_logs: inputs.verbose})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule EditAgentProvider do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :provider, :string
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:update_agent_def, fn _repo, %{agent: agent} ->
        agent.agent_def
        |> Operately.People.AgentDef.changeset(%{provider: inputs.provider})
        |> Operately.Repo.update()
      end)
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule CreateConversation do
    use TurboConnect.Mutation

    inputs do
      field :action_id, :string
      field :context_type, :create_conversation_context_type
      field :context_id, :id
    end

    outputs do
      field :success, :boolean
      field :conversation, :agent_conversation
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Ecto.Multi.run(:convo, fn _repo, %{me: me} ->
        Operately.People.AgentConvo.create(me, inputs.action_id, inputs.context_type, inputs.context_id)
      end)
      |> Steps.respond(fn %{convo: convo} ->
        convo =
          Operately.Repo.preload(convo, [
            :author,
            messages: Operately.People.AgentConvo.user_facing_messages_query()
          ])

        %{
          success: true,
          conversation: OperatelyWeb.Api.Serializer.serialize(convo, level: :full)
        }
      end)
    end
  end

  defmodule SendMessage do
    use TurboConnect.Mutation

    inputs do
      field :conversation_id, :id
      field :message, :string
    end

    outputs do
      field :success, :boolean
      field :message, :agent_message
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_conversation(inputs.conversation_id)
      |> Ecto.Multi.run(:message, fn _repo, %{conversation: convo} ->
        Operately.People.AgentMessage.create(convo, inputs.message)
      end)
      |> Steps.respond(fn %{message: message} ->
        %{
          success: true,
          message: OperatelyWeb.Api.Serializer.serialize(message, level: :full)
        }
      end)
    end
  end

  defmodule GetConversationMessages do
    use TurboConnect.Query

    inputs do
      field :convo_id, :string
    end

    outputs do
      field :messages, list_of(:agent_message)
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Ecto.Multi.run(:messages, fn _repo, %{me: me} ->
        Operately.People.AgentConvo.get(me, id: inputs.convo_id)
      end)
      |> Steps.respond(fn res ->
        %{
          messages: OperatelyWeb.Api.Serializer.serialize(res.messages, level: :full)
        }
      end)
    end
  end

  defmodule GetConversations do
    use TurboConnect.Query
    alias OperatelyWeb.Api.Serializer

    inputs do
    end

    outputs do
      field :conversations, list_of(:agent_conversation)
    end

    def call(conn, _inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Ecto.Multi.run(:convos, fn _repo, %{me: me} ->
        {:ok, Operately.People.AgentConvo.list(me)}
      end)
      |> Steps.respond(fn res -> %{conversations: Serializer.serialize(res.convos, level: :full)} end)
    end
  end

  defmodule RunAgent do
    use TurboConnect.Mutation
    alias OperatelyWeb.Api.Serializer

    inputs do
      field :id, :id
    end

    outputs do
      field :run, :agent_run
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.id)
      |> Ecto.Multi.run(:run, fn _, %{agent: agent} -> Operately.People.AgentRun.create(agent.agent_def) end)
      |> Steps.respond(fn res -> %{run: Serializer.serialize(res.run, level: :full)} end)
    end
  end

  defmodule GetAgentRun do
    use TurboConnect.Query
    alias OperatelyWeb.Api.Serializer

    inputs do
      field :id, :id
    end

    outputs do
      field :run, :agent_run
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent_run(inputs.id)
      |> Steps.respond(fn res -> %{run: Serializer.serialize(res.run, level: :full)} end)
    end
  end

  defmodule ListAgentRuns do
    use TurboConnect.Query
    alias OperatelyWeb.Api.Serializer

    inputs do
      field :agent_id, :id
    end

    outputs do
      field :runs, list_of(:agent_run)
    end

    def call(conn, inputs) do
      conn
      |> Steps.start()
      |> Steps.verify_feature_enabled()
      |> Steps.get_agent(inputs.agent_id)
      |> Steps.list_agent_runs()
      |> Steps.respond(fn res -> %{runs: Serializer.serialize(res.runs, level: :full)} end)
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

    def get_conversation(multi, id) do
      Ecto.Multi.run(multi, :conversation, fn _repo, %{me: me} ->
        Operately.Repo.one(
          from(c in Operately.People.AgentConvo,
            where: c.id == ^id and c.author_id == ^me.id
          )
        )
        |> case do
          nil -> {:error, :not_found}
          convo -> {:ok, convo}
        end
      end)
    end

    def list_agents(multi) do
      Ecto.Multi.run(multi, :agents, fn _repo, %{me: me} ->
        {:ok, Operately.People.list_agents(me.company_id)}
      end)
    end

    def get_agent_run(multi, id) do
      Ecto.Multi.run(multi, :run, fn _repo, _ ->
        Operately.People.AgentRun.get_by_id(id)
      end)
    end

    def list_agent_runs(multi) do
      import Ecto.Query, only: [from: 2]

      Ecto.Multi.run(multi, :runs, fn _repo, %{agent: agent} ->
        query =
          from(ar in Operately.People.AgentRun,
            where: ar.agent_def_id == ^agent.agent_def.id,
            order_by: [desc: ar.started_at]
          )

        {:ok, Operately.Repo.all(query)}
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
