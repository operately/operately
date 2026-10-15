defmodule OperatelyWeb.Api.Companies.GrantResourceAccess do
  @moduledoc """
  Grants resource access to a person.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  require Logger
  alias Operately.Access.Binding
  alias Operately.Companies.{Company, Permissions}
  alias Operately.{Goals, Groups, People, Projects}

  inputs do
    field :person_id, :id, null: false
    field :resources, list_of(:resource_access_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         :ok <- authorize_company(me, company_read_only(conn)),
         :ok <- People.validate_active_company_members(me.company_id, [inputs.person_id]),
         :ok <- authorize_resources(me, inputs) do
      process_grant(inputs)
    else
      {:error, :invalid_company_member} -> {:error, :bad_request}
      {:error, _} = error -> error
    end
  end

  defp authorize_company(me, read_only) do
    with {:ok, company} <- Company.get(me, id: me.company_id),
         {:ok, :allowed} <- Permissions.check(company.request_info.access_level, :can_edit_members_access_levels, company_read_only: read_only) do
      :ok
    else
      {:error, _} -> {:error, :forbidden}
    end
  end

  defp authorize_resources(me, inputs) do
    Enum.reduce_while(inputs.resources, :ok, fn grant, :ok ->
      case authorize_resource(me, inputs.person_id, grant) do
        :ok -> {:cont, :ok}
        error -> {:halt, error}
      end
    end)
  end

  defp authorize_resource(me, person_id, grant) do
    {schema, permissions, permission} = resource_policy(grant.resource_type)

    with {:ok, resource} <- schema.get(me, id: grant.resource_id, company_id: me.company_id),
         {:ok, :allowed} <- permissions.check(resource.request_info.access_level, permission, company_read_only: false),
         :ok <- validate_access_level(resource.request_info.access_level, Binding.from_atom(grant.access_level)),
         :ok <- validate_existing_project_access(resource, person_id) do
      :ok
    end
  end

  defp resource_policy(:space), do: {Groups.Group, Groups.Permissions, :has_full_access}
  defp resource_policy(:goal), do: {Goals.Goal, Goals.Permissions, :has_full_access}
  defp resource_policy(:project), do: {Projects.Project, Projects.Permissions, :can_edit}

  defp validate_access_level(caller_access, selected_access) do
    # Callers cannot grant or modify access above their own level.
    if selected_access <= caller_access, do: :ok, else: {:error, :forbidden}
  end

  defp validate_existing_project_access(%Projects.Project{} = project, person_id) do
    case Projects.Project.get(person_id, id: project.id) do
      {:ok, target_project} -> validate_access_level(project.request_info.access_level, target_project.request_info.access_level)
      {:error, :not_found} -> :ok
    end
  end

  defp validate_existing_project_access(_resource, _person_id), do: :ok

  defp process_grant(inputs) do
    case Operately.Operations.ResourceAccessGranting.run(inputs.person_id, inputs.resources) do
      {:ok, _} ->
        {:ok, %{success: true}}

      {:error, _, changeset, _} ->
        Logger.error("Failed to grant resource access: #{inspect(changeset)}")
        {:error, :internal_server_error}

      {:error, error} ->
        Logger.error("Failed to grant resource access: #{inspect(error)}")
        {:error, :internal_server_error}
    end
  end
end
