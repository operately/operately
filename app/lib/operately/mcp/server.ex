defmodule Operately.MCP.Server do
  @moduledoc """
  MCP server that exposes Operately tools to AI agents.
  
  Provides the following tools:
  - switch_organization: Sets the internal context of the conversation
  - get_work_map: Returns the work map from the current organization 
  - get_goal: Returns information about a goal
  - get_project: Returns information about a project
  """
  
  use Hermes.Server,
    name: "Operately MCP Server",
    version: "1.0.0",
    capabilities: [:tools]

  require Logger

  @impl true
  def init(_client_info, frame) do
    {:ok, frame
      |> assign(current_company_id: nil)
      |> assign(current_person_id: nil)
      |> register_switch_organization_tool()
      |> register_get_work_map_tool() 
      |> register_get_goal_tool()
      |> register_get_project_tool()}
  end

  @impl true
  def handle_tool("switch_organization", %{company_id: company_id, person_id: person_id}, frame) do
    # Validate that the company and person exist and are accessible
    with {:ok, company} <- get_company(company_id),
         {:ok, person} <- get_person(person_id),
         true <- person_belongs_to_company?(person, company) do
      
      updated_frame = frame
        |> assign(current_company_id: company.id)
        |> assign(current_person_id: person.id)
        
      response = %{
        success: true,
        message: "Switched to organization: #{company.name}",
        company: %{
          id: company.id,
          name: company.name
        },
        person: %{
          id: person.id,
          full_name: person.full_name,
          email: person.email
        }
      }
      
      {:reply, response, updated_frame}
    else
      {:error, :not_found} ->
        {:reply, %{success: false, error: "Company or person not found"}, frame}
      
      false ->
        {:reply, %{success: false, error: "Person does not belong to this company"}, frame}
        
      error ->
        Logger.error("Error switching organization: #{inspect(error)}")
        {:reply, %{success: false, error: "Failed to switch organization"}, frame}
    end
  end

  @impl true  
  def handle_tool("get_work_map", _params, frame) do
    case get_current_context(frame) do
      {:ok, person, company} ->
        case Operately.WorkMaps.GetWorkMapQuery.execute(person, %{company_id: company.id}) do
          {:ok, workmap} ->
            markdown = Operately.MD.Workmap.render(workmap)
            {:reply, %{success: true, work_map: markdown}, frame}
            
          {:error, error} ->
            Logger.error("Error fetching work map: #{inspect(error)}")
            {:reply, %{success: false, error: "Failed to fetch work map"}, frame}
        end
        
      {:error, error} ->
        {:reply, %{success: false, error: error}, frame}
    end
  end

  @impl true
  def handle_tool("get_goal", %{id: goal_id}, frame) do
    case get_current_context(frame) do
      {:ok, person, _company} ->
        conn = %{assigns: %{current_person: person}}
        
        with {:ok, decoded_id} <- OperatelyWeb.Api.Helpers.decode_id(goal_id) do
          args = %{
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
          }
          
          case OperatelyWeb.Api.Queries.GetGoal.call(conn, args) do
            {:ok, data} ->
              {:reply, %{success: true, goal: data.markdown}, frame}
              
            {:error, error} ->
              Logger.error("Error fetching goal: #{inspect(error)}")
              {:reply, %{success: false, error: "Failed to fetch goal"}, frame}
          end
        else
          {:error, _} ->
            {:reply, %{success: false, error: "Invalid goal ID format"}, frame}
        end
        
      {:error, error} ->
        {:reply, %{success: false, error: error}, frame}
    end
  end

  @impl true
  def handle_tool("get_project", %{id: project_id}, frame) do
    case get_current_context(frame) do
      {:ok, person, _company} ->
        with {:ok, decoded_id} <- OperatelyWeb.Api.Helpers.decode_id(project_id),
             {:ok, project} <- get_project_details(person, decoded_id) do
          
          markdown = Operately.MD.Project.render(project)
          {:reply, %{success: true, project: markdown}, frame}
        else
          {:error, reason} when is_binary(reason) ->
            {:reply, %{success: false, error: "Unable to access project: #{reason}"}, frame}
            
          {:error, reason} ->
            {:reply, %{success: false, error: "Invalid project ID: #{inspect(reason)}"}, frame}
        end
        
      {:error, error} ->
        {:reply, %{success: false, error: error}, frame}
    end
  end

  # Private helper functions
  
  defp register_switch_organization_tool(frame) do
    register_tool(frame, "switch_organization",
      input_schema: %{
        company_id: {:required, :string, description: "The ID of the company to switch to"},
        person_id: {:required, :string, description: "The ID of the person making the switch"}
      },
      description: "Sets the internal context of the conversation to a specific organization"
    )
  end

  defp register_get_work_map_tool(frame) do
    register_tool(frame, "get_work_map",
      input_schema: %{},
      annotations: %{read_only: true},
      description: "Returns the work map from the current organization set in the context"
    )
  end

  defp register_get_goal_tool(frame) do
    register_tool(frame, "get_goal", 
      input_schema: %{
        id: {:required, :string, description: "The ID of the goal to retrieve"}
      },
      annotations: %{read_only: true},
      description: "Returns information about a goal"
    )
  end

  defp register_get_project_tool(frame) do
    register_tool(frame, "get_project",
      input_schema: %{
        id: {:required, :string, description: "The ID of the project to retrieve"}
      },
      annotations: %{read_only: true},
      description: "Returns information about a project"
    )
  end

  defp get_current_context(frame) do
    company_id = frame.assigns[:current_company_id]
    person_id = frame.assigns[:current_person_id]
    
    case {company_id, person_id} do
      {nil, _} -> {:error, "No organization context set. Use switch_organization first."}
      {_, nil} -> {:error, "No person context set. Use switch_organization first."}
      {company_id, person_id} ->
        with {:ok, company} <- get_company(company_id),
             {:ok, person} <- get_person(person_id) do
          {:ok, person, company}
        else
          {:error, :not_found} -> {:error, "Current context is invalid. Organization or person no longer exists."}
          error -> {:error, "Failed to fetch current context: #{inspect(error)}"}
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
end