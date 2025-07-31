defmodule Operately.AI.Tools.Base do
  alias LangChain.Function

  def new_tool(attrs) do
    with_logs = fn args, context ->
      log(context, "TOOL USE: #{attrs.name}\n")

      if args != nil && Map.has_key?(context, :agent_run) && context.agent_run.verbose_logs do
        log(context, "TOOL INPUT:\n" <> inspect(args) <> "\n")
      end

      result = attrs.function.(args, context)

      if Map.has_key?(context, :agent_run) && context.agent_run.verbose_logs do
        case result do
          {:ok, data} -> log(context, "TOOL OUTPUT: #{data}\n")
          {:error, data} -> log(context, "TOOL ERROR: #{data}\n")
        end
      end

      result
    end

    attrs
    |> Map.put(:function, with_logs)
    |> Function.new!()
  end

  defp log(context, msg) do
    if Map.has_key?(context, :agent_run) do
      Operately.People.AgentRun.append_log(context.agent_run.id, msg)
    end
  end
end
