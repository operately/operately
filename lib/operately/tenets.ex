defmodule Operately.Tenets do
  @moduledoc """
  The Tenets context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Tenets.Tenet

  @doc """
  Returns the list of tenets.

  ## Examples

      iex> list_tenets()
      [%Tenet{}, ...]

  """
  def list_tenets do
    Repo.all(Tenet)
  end

  def list_kpis(tenet) do
    Repo.preload(tenet, :kpis).kpis
  end

  def list_objectives(tenet) do
    Repo.preload(tenet, :objectives).objectives
  end

  @doc """
  Gets a single tenet.

  Raises `Ecto.NoResultsError` if the Tenet does not exist.

  ## Examples

      iex> get_tenet!(123)
      %Tenet{}

      iex> get_tenet!(456)
      ** (Ecto.NoResultsError)

  """
  def get_tenet!(id), do: Repo.get!(Tenet, id)

  @doc """
  Creates a tenet.

  ## Examples

      iex> create_tenet(%{field: value})
      {:ok, %Tenet{}}

      iex> create_tenet(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_tenet(attrs \\ %{}) do
    %Tenet{}
    |> Tenet.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a tenet.

  ## Examples

      iex> update_tenet(tenet, %{field: new_value})
      {:ok, %Tenet{}}

      iex> update_tenet(tenet, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_tenet(%Tenet{} = tenet, attrs) do
    tenet
    |> Tenet.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a tenet.

  ## Examples

      iex> delete_tenet(tenet)
      {:ok, %Tenet{}}

      iex> delete_tenet(tenet)
      {:error, %Ecto.Changeset{}}

  """
  def delete_tenet(%Tenet{} = tenet) do
    Repo.delete(tenet)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking tenet changes.

  ## Examples

      iex> change_tenet(tenet)
      %Ecto.Changeset{data: %Tenet{}}

  """
  def change_tenet(%Tenet{} = tenet, attrs \\ %{}) do
    Tenet.changeset(tenet, attrs)
  end
end
