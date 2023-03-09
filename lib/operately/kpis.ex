defmodule Operately.Kpis do
  @moduledoc """
  The Kpis context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Kpis.Kpi

  @doc """
  Returns the list of kpis.

  ## Examples

      iex> list_kpis()
      [%Kpi{}, ...]

  """
  def list_kpis do
    Repo.all(Kpi)
  end

  @doc """
  Gets a single kpi.

  Raises `Ecto.NoResultsError` if the Kpi does not exist.

  ## Examples

      iex> get_kpi!(123)
      %Kpi{}

      iex> get_kpi!(456)
      ** (Ecto.NoResultsError)

  """
  def get_kpi!(id), do: Repo.get!(Kpi, id)

  @doc """
  Creates a kpi.

  ## Examples

      iex> create_kpi(%{field: value})
      {:ok, %Kpi{}}

      iex> create_kpi(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_kpi(attrs \\ %{}) do
    %Kpi{}
    |> Kpi.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a kpi.

  ## Examples

      iex> update_kpi(kpi, %{field: new_value})
      {:ok, %Kpi{}}

      iex> update_kpi(kpi, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_kpi(%Kpi{} = kpi, attrs) do
    kpi
    |> Kpi.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a kpi.

  ## Examples

      iex> delete_kpi(kpi)
      {:ok, %Kpi{}}

      iex> delete_kpi(kpi)
      {:error, %Ecto.Changeset{}}

  """
  def delete_kpi(%Kpi{} = kpi) do
    Repo.delete(kpi)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking kpi changes.

  ## Examples

      iex> change_kpi(kpi)
      %Ecto.Changeset{data: %Kpi{}}

  """
  def change_kpi(%Kpi{} = kpi, attrs \\ %{}) do
    Kpi.changeset(kpi, attrs)
  end
end
