defmodule OperatelyWeb.Api.Mutations.CompleteCompanySetup do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.Operations.GroupCreation
  alias Operately.Repo

  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi

  inputs do
    field :spaces, list_of(:space_setup_input)
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, company} <- find_company(me),
      {:ok, :allowed} <- authorize(company),
      :ok <- ensure_not_completed(company),
      :ok <- validate_spaces(inputs.spaces),
      {:ok, _} <- run_setup(me, inputs.spaces)
    ) do
      {:ok, %{}}
    else
      {:error, :not_found} ->
        {:error, :not_found}

      {:error, :forbidden} ->
        {:error, :forbidden}

      {:error, :already_completed} ->
        {:error, :bad_request}

      {:error, {:space_creation_failed, %Ecto.Changeset{}}} ->
        {:error, :bad_request}

      {:error, {:space_creation_failed, _}} ->
        {:error, :internal_server_error}

      {:error, %Ecto.Changeset{}} ->
        {:error, :bad_request}

      {:error, :invalid_space, message} ->
        {:error, :bad_request, message}

      _ ->
        {:error, :internal_server_error}
    end
  end

  def find_company(me) do
    Company.get(me, id: me.company_id)
  end

  defp authorize(company) do
    Permissions.check(company.request_info.access_level, :can_manage_owners)
  end

  defp ensure_not_completed(company) do
    if company.setup_completed do
      {:error, :already_completed}
    else
      :ok
    end
  end

  defp run_setup(owner, spaces) do
    Multi.new()
    |> Multi.run(:company, fn _, _ -> lock_company(owner.company_id) end)
    |> Multi.run(:spaces, fn _, _ -> create_spaces(owner, spaces) end)
    |> Multi.update(:updated_company, fn %{company: company} ->
      Company.changeset(company, %{setup_completed: true})
    end)
    |> Repo.transaction()
    |> case do
      {:ok, _} -> {:ok, :completed}
      {:error, :company, reason, _} -> {:error, reason}
      {:error, :spaces, reason, _} -> {:error, reason}
      {:error, :updated_company, reason, _} -> {:error, reason}
      other -> other
    end
  end

  defp lock_company(nil), do: {:error, :not_found}

  defp lock_company(company_id) do
    query =
      from(c in Company,
        where: c.id == ^company_id,
        lock: "FOR UPDATE"
      )

    case Repo.one(query) do
      nil ->
        {:error, :not_found}

      %Company{setup_completed: true} ->
        {:error, :already_completed}

      company ->
        {:ok, company}
    end
  end

  defp create_spaces(_owner, []), do: {:ok, []}

  defp create_spaces(owner, spaces) do
    Enum.reduce_while(spaces, {:ok, []}, fn space, {:ok, created} ->
      attrs = %{
        name: space.name,
        mission: space.description,
        company_permissions: 70,
        public_permissions: 0
      }

      case GroupCreation.run(owner, attrs) do
        {:ok, space} -> {:cont, {:ok, [space | created]}}
        {:error, reason} -> {:halt, {:error, {:space_creation_failed, reason}}}
      end
    end)
    |> case do
      {:ok, spaces} -> {:ok, Enum.reverse(spaces)}
      {:error, reason} -> {:error, reason}
    end
  end

  defp validate_spaces([]), do: :ok

  defp validate_spaces([space | spaces]) do
    cond do
      is_nil(space.name) or String.trim(space.name) == "" ->
        {:error, :invalid_space, "name can't be blank"}

      is_nil(space.description) or String.trim(space.description) == "" ->
        {:error, :invalid_space, "description can't be blank"}

      true ->
        validate_spaces(spaces)
    end
  end
end
