defmodule Operately.People.AgentConvo.Create do
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.People.AgentConvo
  alias Operately.People.AgentMessage

  def run(person, action_name, context_type, context_id) do
    Multi.new()
    |> Multi.put(:person, person)
    |> Multi.put(:context_id, context_id)
    |> Multi.put(:context_type, context_type)
    |> find_action(action_name)
    |> build_context_prompt()
    |> insert_convo()
    |> insert_system_message()
    |> insert_user_message()
    |> insert_response_placeholder()
    |> schedule_response()
    |> Repo.transaction()
    |> Repo.extract_result(:convo)
  end

  defp find_action(multi, action_name) do
    Multi.run(multi, :action, fn _, %{context_type: context_type} ->
      case Operately.Ai.Prompts.find_action(context_type, action_name) do
        {:ok, action} -> {:ok, action}
        {:error, _} -> {:error, "Action not found: #{action_name} for context #{context_type}"}
      end
    end)
  end

  defp insert_convo(multi) do
    Multi.insert(multi, :convo, fn ctx ->
      case ctx.context_type do
        :goal -> AgentConvo.changeset(%{title: ctx.action.label, author_id: ctx.person.id, goal_id: ctx.context_id})
        :project -> AgentConvo.changeset(%{title: ctx.action.label, author_id: ctx.person.id, project_id: ctx.context_id})
      end
    end)
  end

  defp insert_system_message(multi) do
    Multi.insert(multi, :system_message, fn %{convo: convo} ->
      AgentMessage.changeset(%{
        index: 0,
        convo_id: convo.id,
        status: :done,
        source: :system,
        prompt: Operately.Ai.Prompts.system_prompt(),
        message: "system prompt"
      })
    end)
  end

  defp insert_user_message(multi) do
    Multi.insert(multi, :user_message, fn ctx ->
      AgentMessage.changeset(%{
        index: 1,
        convo_id: ctx.convo.id,
        status: :done,
        source: :user,
        message: "Run action: '#{ctx.action.label}'",
        prompt: ctx.action.prompt <> ctx.context_prompt
      })
    end)
  end

  defp insert_response_placeholder(multi) do
    Multi.insert(multi, :response_placeholder, fn ctx ->
      AgentMessage.changeset(%{
        index: 2,
        convo_id: ctx.convo.id,
        status: :pending,
        source: :ai,
        message: "...",
        prompt: "..."
      })
    end)
  end

  defp build_context_prompt(multi) do
    Multi.run(multi, :context_prompt, fn _, ctx ->
      case ctx.context_type do
        :goal ->
          goal = Operately.Repo.get!(Operately.Goals.Goal, ctx.context_id)
          {:ok, "\n\n** Input goal: **\n\n" <> Operately.MD.Goal.render(goal)}

        :project ->
          # Project context is now provided through the tool context, not the prompt
          {:ok, ""}

        _ ->
          {:error, "Unsupported context type: #{inspect(ctx.context_type)}"}
      end
    end)
  end

  defp schedule_response(multi) do
    Multi.run(multi, :schedule_response, fn _repo, ctx ->
      Operately.Ai.AgentConvoWorker.schedule_message_response(ctx.response_placeholder)
    end)
  end
end
