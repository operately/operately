defmodule Operately.Ai.Prompts do
  use Agent
  defstruct [:system_prompt, :actions]

  @default_path "priv/prompts.yaml"

  defmodule Action do
    defstruct [:name, :prompt, :context]
  end

  def start_link(_opts \\ []) do
    Agent.start_link(fn -> nil end, name: __MODULE__)
  end

  def system_prompt do
    get_cached_prompts().system_prompt
  end

  def find_action(context_type, action_name) do
    get_cached_prompts().actions
    |> Enum.find(fn action -> action.name == action_name and action.context == context_type end)
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

  defp load do
    content = load_file() |> YamlElixir.read_from_string!()

    %Operately.Ai.Prompts{
      system_prompt: content["system"],
      actions: parse_actions(content["actions"])
    }
  end

  defp parse_actions(nil), do: []

  defp parse_actions(actions) when is_list(actions) do
    Enum.map(actions, fn action ->
      %Operately.Ai.Prompts.Action{
        name: action["name"],
        prompt: action["prompt"],
        context: action["context"]
      }
    end)
  end

  defp load_file do
    if System.get_env("OPERATELY_AI_PROMPTS_FILE_PATH") do
      File.read!(System.get_env("OPERATELY_AI_PROMPTS_FILE_PATH"))
    else
      Application.app_dir(:operately, @default_path)
    end
  end
end
