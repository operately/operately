defmodule Operately.AI.Tools.GetGoalDetails do
  alias Operately.AI.Tools.Base

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

            args = %{
              id: id,
              include_champion: true,
              include_closed_by: true,
              include_last_check_in: true,
              include_permissions: true,
              include_projects: true,
              include_reviewer: true,
              include_space: true,
              include_privacy: true,
              include_retrospective: true
            }

            {:ok, goal} = OperatelyWeb.Api.Queries.GetGoal.call(conn, args)
            {:ok, as_markdown(goal)}

          {:error, _} ->
            {:error, "Invalid goal ID format."}
        end
      end
    })
  end

  def as_markdown(%{goal: goal}) do
    """
    # #{goal.name}

    **Status:** #{String.capitalize(goal.status)}
    **Progress:** #{goal.progress_percentage}%
    **ID:** #{goal.id}
    #{if goal.space, do: "**Space:** #{goal.space.name}  ", else: ""}
    **Privacy:** #{String.capitalize(goal.privacy || "unknown")}

    #{if goal.description, do: "## Description\n\n#{goal.description}\n", else: ""}
    ## People

    #{format_people(goal)}

    ## Timeframe

    **Start Date:** #{format_date(goal.timeframe.contextual_start_date)}
    **End Date:** #{format_date(goal.timeframe.contextual_end_date)}

    #{if goal.next_update_scheduled_at, do: "**Next Update Scheduled:** #{format_datetime(goal.next_update_scheduled_at)}\n", else: ""}
    ## Targets

    #{format_targets(goal.targets)}

    #{format_projects(goal.projects)}

    ## Status Information

    - **Created:** #{format_datetime(goal.inserted_at)}
    - **Last Updated:** #{format_datetime(goal.updated_at)}
    - **Is Closed:** #{goal.is_closed}
    - **Is Archived:** #{goal.is_archived}
    - **Is Outdated:** #{goal.is_outdated}
    #{if goal.closed_at, do: "- **Closed At:** #{format_datetime(goal.closed_at)}", else: ""}
    #{if goal.archived_at, do: "- **Archived At:** #{format_datetime(goal.archived_at)}", else: ""}

    #{if goal.last_check_in, do: format_last_check_in(goal.last_check_in), else: ""}
    #{if goal.retrospective, do: format_retrospective(goal.retrospective), else: ""}
    """
  end

  defp format_date(%{value: value}) do
    "#{value}"
  end

  defp format_datetime(datetime_string) do
    case DateTime.from_iso8601(datetime_string) do
      {:ok, datetime, _} ->
        DateTime.to_string(datetime)

      {:error, _} ->
        datetime_string
    end
  end

  defp format_targets([]), do: "_No targets defined._"

  defp format_targets(targets) do
    targets
    |> Enum.sort_by(& &1.index)
    |> Enum.map_join("\n", fn target ->
      progress = calculate_target_progress(target)
      "#{target.index + 1}. **#{target.name}**
         - Current Value: #{target.value} #{target.unit}
         - Target: #{target.to} #{target.unit}
         - Starting From: #{target.from} #{target.unit}
         - Progress: #{progress}%"
    end)
  end

  defp calculate_target_progress(%{value: value, from: from, to: to}) when from != to do
    progress = (value - from) / (to - from) * 100
    Float.round(progress, 1)
  end

  defp calculate_target_progress(_), do: 0.0

  defp format_last_check_in(nil), do: ""

  defp format_last_check_in(check_in) do
    """
    ## Last Check-in

    #{check_in}
    """
  end

  defp format_retrospective(nil), do: ""

  defp format_retrospective(retrospective) do
    """
    ## Retrospective

    #{retrospective}
    """
  end

  defp format_people(goal) do
    champion_info = format_person("Champion", goal.champion)
    reviewer_info = format_person("Reviewer", goal.reviewer)

    [champion_info, reviewer_info]
    |> Enum.filter(&(&1 != ""))
    |> Enum.join("\n")
    |> case do
      "" -> "_No people assigned._"
      info -> info
    end
  end

  defp format_person(_role, nil), do: ""

  defp format_person(role, person) do
    "**#{role}:** #{person.full_name} (#{person.title}) - #{person.id}"
  end

  defp format_projects([]), do: ""

  defp format_projects(projects) when is_list(projects) do
    """
    ## Related Projects

    #{Enum.map_join(projects, "\n", fn project -> "- #{project.name} (ID: #{project.id})" end)}
    """
  end
end
