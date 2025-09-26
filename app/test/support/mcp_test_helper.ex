defmodule Operately.MCP.TestHelper do
  @moduledoc """
  Test helper module to simulate MCP server functionality without network dependencies.
  This is used to test the core logic of the MCP server tools.
  """

  @doc """
  Simulates the switch_organization tool logic
  """
  def test_switch_organization_logic(company_id, person_id) do
    # Simulate the logic from handle_tool("switch_organization", ...)
    with {:ok, company} <- get_company_simulation(company_id),
         {:ok, person} <- get_person_simulation(person_id),
         true <- person_belongs_to_company_simulation?(person, company) do
      
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
      
      {:ok, response}
    else
      {:error, :not_found} ->
        {:error, %{success: false, error: "Company or person not found"}}
      
      false ->
        {:error, %{success: false, error: "Person does not belong to this company"}}
        
      error ->
        {:error, %{success: false, error: "Failed to switch organization: #{inspect(error)}"}}
    end
  end

  @doc """
  Simulates the context validation logic
  """
  def test_context_validation(current_company_id, current_person_id) do
    case {current_company_id, current_person_id} do
      {nil, _} -> {:error, "No organization context set. Use switch_organization first."}
      {_, nil} -> {:error, "No person context set. Use switch_organization first."}
      {company_id, person_id} ->
        with {:ok, company} <- get_company_simulation(company_id),
             {:ok, person} <- get_person_simulation(person_id) do
          {:ok, person, company}
        else
          {:error, :not_found} -> {:error, "Current context is invalid. Organization or person no longer exists."}
          error -> {:error, "Failed to fetch current context: #{inspect(error)}"}
        end
    end
  end

  # Simulation functions
  defp get_company_simulation("valid_company_id") do
    {:ok, %{id: "valid_company_id", name: "Test Company"}}
  end
  
  defp get_company_simulation(_), do: {:error, :not_found}
  
  defp get_person_simulation("valid_person_id") do
    {:ok, %{id: "valid_person_id", full_name: "Test Person", email: "test@company.com", company_id: "valid_company_id"}}
  end
  
  defp get_person_simulation(_), do: {:error, :not_found}
  
  defp person_belongs_to_company_simulation?(person, company) do
    person.company_id == company.id
  end
end