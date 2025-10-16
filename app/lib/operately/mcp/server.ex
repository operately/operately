defmodule Operately.MCP.Server do
  @moduledoc """
  MCP server that exposes Operately data through `search` and `fetch` tools.
  """

  use Hermes.Server,
    name: "Operately MCP Server",
    version: "1.0.0",
    capabilities: [:tools]

  require Logger

  @impl true
  def init(_client_info, frame) do
    company_id = frame.assigns[:current_company] && frame.assigns[:current_company].id
    person_id = frame.assigns[:current_person] && frame.assigns[:current_person].id

    {:ok,
     frame
     |> assign_new(:current_company_id, fn -> company_id end)
     |> assign_new(:current_person_id, fn -> person_id end)
     |> register_search_tool()
     |> register_fetch_tool()}
  end

  @impl true
  def handle_tool_call("search", params, frame) do
    query = Map.get(params, :query, "")

    case get_current_context(frame) do
      {:ok, person, company} ->
        case build_search_results(person, company, query) do
          {:ok, results} -> {:reply, text_content(%{results: results}), frame}
          {:error, message} -> {:reply, text_content(%{error: message}), frame}
        end

      {:error, message} ->
        {:reply, text_content(%{error: message}), frame}
    end
  end

  @impl true
  def handle_tool_call("fetch", params, frame) do
    document_id = Map.get(params, :id) || Map.get(params, :document_id)

    case get_current_context(frame) do
      {:ok, person, _company} ->
        case fetch_document(person, document_id) do
          {:ok, document} -> {:reply, text_content(document), frame}
          {:error, message} -> {:reply, text_content(%{error: message}), frame}
        end

      {:error, message} ->
        {:reply, text_content(%{error: message}), frame}
    end
  end

  defp register_search_tool(frame) do
    register_tool(frame, "search",
      input_schema: %{
        query: {:required, :string, description: "Query string used to find Operately resources"}
      },
      annotations: %{read_only: true},
      description: "Search Operately resources and return matching document identifiers"
    )
  end

  defp register_fetch_tool(frame) do
    register_tool(frame, "fetch",
      input_schema: %{
        id: {:required, :string, description: "Identifier returned from the search tool"}
      },
      annotations: %{read_only: true},
      description: "Retrieve the full content for a search result identifier"
    )
  end

  defp build_search_results(person, _company, query) do
    with {:ok, goal_results} <- search_goals(person, query),
         {:ok, project_results} <- search_projects(person, query) do
      {:ok, goal_results ++ project_results}
    else
      {:error, message} -> {:error, message}
    end
  end

  defp search_goals(person, query) do
    conn = %{assigns: %{current_person: person}}

    case OperatelyWeb.Api.Queries.GetGoals.call(conn, %{}) do
      {:ok, data} ->
        goals =
          data.goals
          |> Enum.filter(&matches_query?(&1.name, query))
          |> Enum.map(fn goal ->
            %{
              id: goal_id(goal.id),
              title: goal.name,
              url: goal_id(goal.id),
              metadata: %{type: "goal"}
            }
          end)

        {:ok, goals}

      other ->
        Logger.error("Error searching goals: #{inspect(other)}")
        {:error, "Failed to search goals"}
    end
  end

  defp search_projects(person, query) do
    conn = %{assigns: %{current_person: person}}

    case OperatelyWeb.Api.Queries.GetProjects.call(conn, %{}) do
      {:ok, data} ->
        projects =
          data.projects
          |> Enum.filter(&matches_query?(&1.name, query))
          |> Enum.map(fn project ->
            %{
              id: project_id(project.id),
              title: project.name,
              url: project_id(project.id),
              metadata: %{type: "project"}
            }
          end)

        {:ok, projects}

      other ->
        Logger.error("Error searching projects: #{inspect(other)}")
        {:error, "Failed to search projects"}
    end
  end

  defp matches_query?(_value, query) when is_binary(query) and query == "" do
    true
  end

  defp matches_query?(value, query) when is_binary(value) and is_binary(query) do
    String.contains?(String.downcase(value), String.downcase(query))
  end

  defp matches_query?(_value, _query), do: false

  defp fetch_document(_person, nil), do: {:error, "Document identifier is required"}

  defp fetch_document(person, "operately://goals/" <> goal_id) do
    fetch_goal_document(person, goal_id)
  end

  defp fetch_document(person, "operately://projects/" <> project_id) do
    fetch_project_document(person, project_id)
  end

  defp fetch_document(_person, _id), do: {:error, "Unsupported document identifier"}

  defp fetch_goal_document(person, goal_id) do
    conn = %{assigns: %{current_person: person}}

    with {:ok, decoded_id} <- OperatelyWeb.Api.Helpers.decode_id(goal_id),
         args <- %{
           id: decoded_id,
           include_champion: true,
           include_closed_by: true,
           include_last_check_in: true,
           include_permissions: true,
           include_projects: true,
           include_reviewer: true,
           include_space: true,
           include_privacy: true,
           include_retrospective: true,
           include_markdown: true
         },
         {:ok, data} <- OperatelyWeb.Api.Queries.GetGoal.call(conn, args),
         {:ok, title} <- goal_title(data.goal) do
      {:ok,
       %{
         id: goal_id(goal_id),
         title: title,
         text: data.markdown,
         url: goal_id(goal_id),
         metadata: %{type: "goal"}
       }}
    else
      {:error, :bad_request} ->
        {:error, "Invalid goal identifier"}

      {:error, :not_found} ->
        {:error, "Goal not found"}

      {:error, reason} when is_binary(reason) ->
        {:error, reason}

      error ->
        Logger.error("Error fetching goal document: #{inspect(error)}")
        {:error, "Failed to fetch goal"}
    end
  end

  defp fetch_project_document(person, project_id) do
    with {:ok, decoded_id} <- OperatelyWeb.Api.Helpers.decode_id(project_id),
         {:ok, project} <- get_project_details(person, decoded_id) do
      {:ok,
       %{
         id: project_id(project_id),
         title: project.name,
         text: Operately.MD.Project.render(project),
         url: project_id(project_id),
         metadata: %{type: "project"}
       }}
    else
      {:error, reason} when is_binary(reason) ->
        {:error, reason}

      {:error, _reason} ->
        {:error, "Invalid project identifier"}

      error ->
        Logger.error("Error fetching project document: #{inspect(error)}")
        {:error, "Failed to fetch project"}
    end
  end

  defp goal_title(%{} = goal) do
    title = Map.get(goal, :name) || Map.get(goal, "name")

    if is_binary(title) do
      {:ok, title}
    else
      {:error, "Goal title is unavailable"}
    end
  end

  defp goal_title(_), do: {:error, "Goal title is unavailable"}

  defp goal_id(id), do: "operately://goals/#{id}"
  defp project_id(id), do: "operately://projects/#{id}"

  defp get_current_context(frame) do
    company_id = frame.assigns[:current_company_id]
    person_id = frame.assigns[:current_person_id]

    case {company_id, person_id} do
      {nil, _} ->
        {:error, "No organization context available for this MCP session. Access the /:org_id/sso endpoint to initialize it."}

      {_, nil} ->
        {:error, "No person context available for this MCP session. Sign in to Operately before calling tools."}

      {company_id, person_id} ->
        with {:ok, company} <- get_company(company_id),
             {:ok, person} <- get_person(person_id),
             true <- person_belongs_to_company?(person, company) do
          {:ok, person, company}
        else
          false ->
            {:error, "Current person cannot access this organization"}

          {:error, :not_found} ->
            {:error, "Current context is invalid. Organization or person no longer exists"}

          error ->
            Logger.error("Error fetching current context: #{inspect(error)}")
            {:error, "Failed to fetch current context"}
        end
    end
  end

  defp get_company(company_id) do
    try do
      company = Operately.Companies.get_company!(company_id)
      {:ok, company}
    rescue
      Ecto.NoResultsError -> {:error, :not_found}
    end
  end

  defp get_person(person_id) do
    case Operately.People.get_person(person_id) do
      nil -> {:error, :not_found}
      person -> {:ok, person}
    end
  end

  defp person_belongs_to_company?(person, company) do
    person.company_id == company.id
  end

  defp get_project_details(person, project_id) do
    Operately.Projects.Project.get(person,
      id: project_id,
      opts: [
        with_deleted: false,
        preload: [
          :group,
          :creator,
          :goal,
          :retrospective,
          :milestones,
          [check_ins: [:author]],
          [contributors: [:person]]
        ]
      ]
    )
  end

  defp text_content(data) do
    %{content: [%{type: "text", text: Jason.encode!(data)}]}
  end
end
