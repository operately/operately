defmodule Operately.AI.Tools do
  @moduledoc """
  Provides AI tools for interacting with Operately's API.
  """

  alias Operately.AI.Tools.Base
  alias Operately.People.AgentRun

  defdelegate work_map(), to: Operately.AI.Tools.WorkMap

  def add_agent_task do
    Base.new_tool(%{
      name: "add_agent_task",
      description: "Adds a task to the agent run.",
      parameters_schema: %{
        type: "object",
        properties: %{
          name: %{
            type: "string",
            description: "The description of the task."
          }
        },
        required: ["name"]
      },
      function: fn args, context ->
        if context.agent_run.status != :planning do
          {:error, "Cannot add task when agent run is not in planning phase."}
        else
          agent_run = Map.get(context, :agent_run)
          name = Map.get(args, "name")

          {:ok, _} = AgentRun.add_task(agent_run, name)
          {:ok, "Task '#{name}' added to agent run #{agent_run.id}."}
        end
      end
    })
  end

  @doc """
  Provides details of a goal.

  Expects the following arguments:
  - "id": The ID of the goal for which details are requested.

  Expected context:
  - :person - The person requesting the goal details.
  - :agent_run_id - The ID of the agent run.
  """
  def get_goal_details do
    Base.new_tool(%{
      name: "get_goal_details",
      description: "Returns the details of the goal.",
      parameters_schema: %{
        type: "object",
        properties: %{
          id: %{
            type: "string",
            description: "The ID of the goal."
          }
        },
        required: ["id"]
      },
      function: fn args, context ->
        case OperatelyWeb.Api.Helpers.decode_id(Map.get(args, "id")) do
          {:ok, id} ->
            me = Map.get(context, :person)
            conn = %{assigns: %{current_person: me}}
            args = %{id: id}

            {:ok, goal} = OperatelyWeb.Api.Queries.GetGoal.call(conn, args)
            Jason.encode(goal)

          {:error, _} ->
            {:error, "Invalid goal ID format."}
        end
      end
    })
  end

  @doc """
  Posts a message to a goal.

  Expects the following arguments:
  - "title": The title of the message.
  - "message": The markdown message to post to the goal.
  - "goal_id": The ID of the goal to which the message will be posted.

  Expected context:
  - :person - The person posting the message.
  """
  def post_goal_message do
    Base.new_tool(%{
      name: "post_goal_message",
      description: "Posts a message to the goal.",
      parameters_schema: %{
        type: "object",
        properties: %{
          goal_id: %{
            type: "string",
            description: "The ID of the goal to which the message will be posted."
          },
          title: %{
            type: "string",
            description: "The title of the message."
          },
          message: %{
            type: "string",
            description: "The markdown message to post to the goal."
          }
        },
        required: ["title", "message"]
      },
      function: fn args, context ->
        log_details = [
          "  Goal ID: #{args["goal_id"]}",
          "  Title: #{args["title"]}",
          "",
          args["message"] |> line_break(at: 80) |> indent(with: "  ")
        ]

        log(context, Enum.join(log_details, "\n") <> "\n")

        me = Map.get(context, :person)
        title = Map.get(args, "title")
        goal_id = Map.get(args, "goal_id")
        message = Map.get(args, "message") |> Operately.Demo.PoorMansMarkdown.from_markdown(%{}) |> Jason.encode!()

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        args =
          %{
            goal_id: goal_id,
            title: title,
            message: message,
            send_notifications_to_everyone: true,
            subscriber_ids: []
          }

        if context.agent_run.sandbox_mode do
          {:ok, "posted"}
        else
          {:ok, resp} = OperatelyWeb.Api.Mutations.CreateGoalDiscussion.call(conn, args)
          Jason.encode(resp)
        end
      end
    })
  end

  @doc """
  Posts a message to a project.

  Expects the following arguments:
  - "title": The title of the message.
  - "message": The markdown message to post to the project.
  - "project_id": The ID of the project to which the message will be posted.

  Expected context:
  - :person - The person posting the message.
  """
  def post_project_message do
    Base.new_tool(%{
      name: "post_project_message",
      description: "Posts a message to the project.",
      parameters_schema: %{
        type: "object",
        properties: %{
          project_id: %{
            type: "string",
            description: "The ID of the project to which the message will be posted."
          },
          title: %{
            type: "string",
            description: "The title of the message."
          },
          message: %{
            type: "string",
            description: "The markdown message to post to the project."
          }
        },
        required: ["title", "message"]
      },
      function: fn args, context ->
        log_details = [
          "  Project ID: #{args["project_id"]}",
          "  Title: #{args["title"]}",
          "",
          args["message"] |> line_break(at: 80) |> indent(with: "  ")
        ]

        log(context, Enum.join(log_details, "\n") <> "\n")

        me = Map.get(context, :person)
        title = Map.get(args, "title")
        project_id = Map.get(args, "project_id")
        message = Map.get(args, "message") |> Operately.Demo.PoorMansMarkdown.from_markdown(%{})

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(project_id)

        args =
          %{
            project_id: id,
            title: title,
            message: message,
            send_notifications_to_everyone: true,
            subscriber_ids: []
          }

        if context.agent_run.sandbox_mode do
          {:ok, "posted"}
        else
          {:ok, resp} = OperatelyWeb.Api.ProjectDiscussions.Create.call(conn, args)
          Jason.encode(resp)
        end
      end
    })
  end

  #
  # Helper functions
  #

  defp log(context, msg) do
    if Map.has_key?(context, :agent_run) do
      Operately.People.AgentRun.append_log(context.agent_run.id, msg)
    end
  end

  defp indent(text, with: prefix) do
    text
    |> String.split("\n")
    |> Enum.map(&"#{prefix}#{&1}")
    |> Enum.join("\n")
  end

  defp line_break(text, at: length) do
    text
    |> String.split(" ")
    |> Enum.reduce({[], 0}, fn word, {lines, current_length} ->
      if current_length + String.length(word) + 1 > length do
        {lines ++ ["\n" <> word], String.length(word)}
      else
        {lines ++ [word], current_length + String.length(word) + 1}
      end
    end)
    |> elem(0)
    |> Enum.join(" ")
  end
end
