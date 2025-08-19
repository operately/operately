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
    |> build_context_prompt(context_type, context_id)
    |> insert_convo()
    |> insert_system_message()
    |> insert_user_message()
    |> schedule_response()
    |> Repo.transaction()
    |> Repo.extract_result(:convo)
  end

  defp find_action(multi, action_name) do
    Multi.run(multi, :action, fn %{context_type: context_type} ->
      case Operately.Ai.Prompts.find_action(context_type, action_name) do
        {:ok, action} -> {:ok, action}
        {:error, _} -> {:error, "Action not found: #{action_name} for context #{context_type}"}
      end
    end)
  end

  defp insert_convo(multi) do
    Multi.insert(multi, :convo, fn ctx ->
      case ctx.context_type do
        "goal" -> AgentConvo.changeset(%{title: ctx.action.label, author_id: ctx.person.id, goal_id: ctx.context_id})
        "project" -> AgentConvo.changeset(%{title: ctx.action.label, author_id: ctx.person.id, project_id: ctx.context_id})
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

  defp build_context_prompt(multi, "goal", goal_id) do
    Multi.run(multi, :context_prompt, fn _ ->
      goal = Operately.Repo.get!(Operately.Goals.Goal, goal_id)
      {:ok, "\n\n** Input goal: **\n\n" <> Operately.MD.Goal.render(goal)}
    end)
  end

  defp build_context_prompt(multi, "project", project_id) do
    Multi.run(multi, :context_prompt, fn _ ->
      project = Operately.Repo.get!(Operately.Projects.Project, project_id)
      {:ok, "\n\n** Input project: **\n\n" <> Operately.MD.Project.render(project)}
    end)
  end

  defp build_context_prompt(multi, context_type, _context_id) do
    Multi.run(multi, :context_prompt, fn _ ->
      {:error, "Unsupported context type: #{context_type}"}
    end)
  end

  defp schedule_response(multi) do
    Multi.run(multi, :schedule_response, fn _repo, %{convo: convo} ->
      Operately.Ai.AgentConvoWorker.new(%{convo_id: convo.id}) |> Oban.insert()
    end)
  end
end
