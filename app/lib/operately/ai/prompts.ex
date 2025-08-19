defmodule Operately.Ai.Prompts do
  use Agent
  defstruct [:system_prompt, :actions]

  @default_path "priv/prompts.yaml"

  defmodule Action do
    defstruct [:id, :label, :context, :prompt]
  end

  def start_link(_opts \\ []) do
    Agent.start_link(fn -> nil end, name: __MODULE__)
  end

  def system_prompt do
    get_cached_prompts().system_prompt
  end

  def actions do
    get_cached_prompts().actions
  end

  def find_action(context_type, action_id) when is_atom(context_type) do
    find_action(Atom.to_string(context_type), action_id)
  end

  def find_action(context_type, action_id) do
    get_cached_prompts().actions
    |> Enum.find(fn action -> action.id == action_id and action.context == context_type end)
    |> case do
      nil -> {:error, :not_found}
      action -> {:ok, action}
    end
  end

  defp get_cached_prompts do
    case Agent.get(__MODULE__, & &1) do
      nil ->
        prompts = load()
        Agent.update(__MODULE__, fn _ -> prompts end)
        prompts

      cached_prompts ->
        cached_prompts
    end
  end

  def reload do
    Agent.update(__MODULE__, fn _ -> load() end)
  end

  defp load do
    file_path()
    |> YamlElixir.read_all_from_file!()
    |> parse_prompts()
  end

  defp parse_prompts([content]) do
    %Operately.Ai.Prompts{
      system_prompt: content["system"],
      actions: parse_actions(content["actions"])
    }
  end

  defp parse_actions(nil), do: []

  defp parse_actions(actions) when is_list(actions) do
    Enum.map(actions, fn action ->
      %Operately.Ai.Prompts.Action{
        id: action["id"],
        label: action["label"],
        context: action["context"],
        prompt: action["prompt"]
      }
    end)
  end

  defp file_path do
    if System.get_env("OPERATELY_AI_PROMPTS_FILE_PATH") do
      System.get_env("OPERATELY_AI_PROMPTS_FILE_PATH")
    else
      Application.app_dir(:operately, @default_path)
    end
  end
end
