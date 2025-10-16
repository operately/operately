defmodule Operately.MCP.TestHelper do
  @moduledoc """
  Test helper module to simulate the MCP server search and fetch logic without
  invoking Hermes runtime.
  """

  @sample_goals [
    %{id: "goal-1", name: "Improve activation"},
    %{id: "goal-2", name: "Increase retention"}
  ]

  @sample_projects [
    %{id: "project-1", name: "Launch onboarding"},
    %{id: "project-2", name: "Lifecycle emails rollout"}
  ]

  @doc """
  Simulates the server-side search behaviour using in-memory data.
  """
  def simulate_search(query \\ "") do
    goals =
      @sample_goals
      |> Enum.filter(&matches_query?(&1.name, query))
      |> Enum.map(fn goal ->
        %{
          id: goal_id(goal.id),
          title: goal.name,
          url: goal_id(goal.id),
          metadata: %{type: "goal"}
        }
      end)

    projects =
      @sample_projects
      |> Enum.filter(&matches_query?(&1.name, query))
      |> Enum.map(fn project ->
        %{
          id: project_id(project.id),
          title: project.name,
          url: project_id(project.id),
          metadata: %{type: "project"}
        }
      end)

    goals ++ projects
  end

  @doc """
  Simulates the server-side fetch logic for goals and projects.
  """
  def simulate_fetch("operately://goals/" <> goal_id) do
    with {:ok, goal} <- fetch_goal(goal_id) do
      {:ok,
       %{
         id: goal_id(goal.id),
         title: goal.name,
         text: "**Goal:** #{goal.name}",
         url: goal_id(goal.id),
         metadata: %{type: "goal"}
       }}
    end
  end

  def simulate_fetch("operately://projects/" <> project_id) do
    with {:ok, project} <- fetch_project(project_id) do
      {:ok,
       %{
         id: project_id(project.id),
         title: project.name,
         text: "**Project:** #{project.name}",
         url: project_id(project.id),
         metadata: %{type: "project"}
       }}
    end
  end

  def simulate_fetch(_identifier), do: {:error, "Unsupported document identifier"}

  defp fetch_goal(id) do
    case Enum.find(@sample_goals, &(&1.id == id)) do
      nil -> {:error, "Goal not found"}
      goal -> {:ok, goal}
    end
  end

  defp fetch_project(id) do
    case Enum.find(@sample_projects, &(&1.id == id)) do
      nil -> {:error, "Project not found"}
      project -> {:ok, project}
    end
  end

  defp goal_id(id), do: "operately://goals/#{id}"
  defp project_id(id), do: "operately://projects/#{id}"

  defp matches_query?(_value, query) when query in [nil, ""], do: true

  defp matches_query?(value, query) do
    String.contains?(String.downcase(value), String.downcase(query))
  end
end
