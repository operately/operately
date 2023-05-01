defmodule Operately.Okrs do
  @moduledoc """
  The Okrs context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Okrs.Objective
  alias Operately.Okrs.KeyResult

  def list_objectives(filters \\ %{}) do
    query = if filters[:group_id] do
      from o in Objective, where: o.group_id == ^filters[:group_id]
    else
      from o in Objective
    end

    query = from o in query, order_by: [asc: o.inserted_at]

    Repo.all(query)
  end

  def list_objectives(preload: associations) do
    Repo.all(Objective) |> Repo.preload(associations)
  end

  def list_key_results!(objective_id) do
    query = (
      from kr in KeyResult,
      where: kr.objective_id == ^objective_id
    )

    Repo.all(query)
  end

  def list_aligned_projects!(objective_id) do
    alias Operately.Alignments.Alignment
    alias Operately.Projects.Project

    query = (
      from p in Project,
      join: a in Alignment, on: p.id == a.child and a.child_type == :project,
      where: a.parent == ^objective_id and a.parent_type == :objective
    )

    Repo.all(query)
  end

  @doc """
  Gets a single objective.

  Raises `Ecto.NoResultsError` if the Objective does not exist.

  ## Examples

      iex> get_objective!(123)
      %Objective{}

      iex> get_objective!(456)
      ** (Ecto.NoResultsError)

  """
  def get_objective!(id) do
    Objective
    |> Repo.get!(id)
  end

  def get_objective!(id, preload: associations) do
    get_objective!(id) |> Repo.preload(associations)
  end

  def get_owner!(objective) do
    objective = Repo.preload(objective, [:owner])
    objective.owner
  end

  def get_objective_by_name!(name) do
    Objective |> Repo.get_by!(name: name)
  end

  @doc """
  Creates a objective.

  ## Examples

      iex> create_objective(%{field: value})
      {:ok, %Objective{}}

      iex> create_objective(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_objective(attrs \\ %{}) do
    %Objective{}
    |> Objective.changeset(attrs)
    |> Repo.insert()
  end

  def publish_objective_added(%Objective{} = objective) do
    Absinthe.Subscription.publish(
      OperatelyWeb.Endpoint,
      objective,
      objective_added: "*")

    {:ok, objective}
  end

  def publish_objective_updated(e) do
    e
  end

  @doc """
  Updates a objective.

  ## Examples

      iex> update_objective(objective, %{field: new_value})
      {:ok, %Objective{}}

      iex> update_objective(objective, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_objective(%Objective{} = objective, attrs) do
    objective
    |> Objective.changeset(attrs)
    |> Repo.update()
  end

  def set_objective_owner(id, owner_id \\ nil) do
    objective = get_objective!(id)

    objective
    |> Objective.changeset(%{owner_id: owner_id})
    |> Repo.update()
  end

  def set_key_result_owner(id, owner_id \\ nil) do
    key_result = get_key_result!(id)

    key_result
    |> KeyResult.changeset(%{owner_id: owner_id})
    |> Repo.update()
  end

  @doc """
  Deletes a objective.

  ## Examples

      iex> delete_objective(objective)
      {:ok, %Objective{}}

      iex> delete_objective(objective)
      {:error, %Ecto.Changeset{}}

  """
  def delete_objective(%Objective{} = objective) do
    Repo.delete(objective)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking objective changes.

  ## Examples

      iex> change_objective(objective)
      %Ecto.Changeset{data: %Objective{}}

  """
  def change_objective(%Objective{} = objective, attrs \\ %{}) do
    Objective.changeset(objective, attrs)
  end


  @doc """
  Gets a single key_result.

  Raises if the Key result does not exist.

  ## Examples

      iex> get_key_result!(123)
      %KeyResult{}

  """
  def get_key_result!(id) do
    KeyResult |> Repo.get!(id)
  end

  @doc """
  Creates a key_result.

  ## Examples

      iex> create_key_result(%{field: value})
      {:ok, %KeyResult{}}

      iex> create_key_result(%{field: bad_value})
      {:error, ...}

  """
  def create_key_result(attrs \\ %{}) do
    %KeyResult{}
    |> KeyResult.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a key_result.

  ## Examples

      iex> update_key_result(key_result, %{field: new_value})
      {:ok, %KeyResult{}}

      iex> update_key_result(key_result, %{field: bad_value})
      {:error, ...}

  """
  def update_key_result(%KeyResult{} = key_result, attrs) do
    key_result
    |> KeyResult.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a KeyResult.

  ## Examples

      iex> delete_key_result(key_result)
      {:ok, %KeyResult{}}

      iex> delete_key_result(key_result)
      {:error, ...}

  """
  def delete_key_result(%KeyResult{} = key_result) do
    Repo.delete(key_result)
  end

  @doc """
  Returns a data structure for tracking key_result changes.

  ## Examples

      iex> change_key_result(key_result)
      %Todo{...}

  """
  def change_key_result(%KeyResult{} = key_result, attrs \\ %{}) do
    KeyResult.changeset(key_result, attrs)
  end
end
