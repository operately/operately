defmodule Operately.Okrs do
  @moduledoc """
  The Okrs context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Okrs.Objective
  alias Operately.Okrs.KeyResult

  @doc """
  Returns the list of objectives.

  ## Examples

      iex> list_objectives()
      [%Objective{}, ...]

  """
  def list_objectives do
    Repo.all(Objective)
  end

  def list_objectives(preload: associations) do
    Repo.all(Objective) |> Repo.preload(associations)
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
