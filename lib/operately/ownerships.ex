defmodule Operately.Ownerships do
  @moduledoc """
  The Ownerships context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Ownerships.Ownership

  @doc """
  Returns the list of ownerships.

  ## Examples

      iex> list_ownerships()
      [%Ownership{}, ...]

  """
  def list_ownerships do
    Repo.all(Ownership)
  end

  @doc """
  Gets a single ownership.

  Raises `Ecto.NoResultsError` if the Ownership does not exist.

  ## Examples

      iex> get_ownership!(123)
      %Ownership{}

      iex> get_ownership!(456)
      ** (Ecto.NoResultsError)

  """
  def get_ownership!(id), do: Repo.get!(Ownership, id)

  @doc """
  Creates a ownership.

  ## Examples

      iex> create_ownership(%{field: value})
      {:ok, %Ownership{}}

      iex> create_ownership(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_ownership(attrs \\ %{}) do
    %Ownership{}
    |> Ownership.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a ownership.

  ## Examples

      iex> update_ownership(ownership, %{field: new_value})
      {:ok, %Ownership{}}

      iex> update_ownership(ownership, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_ownership(%Ownership{} = ownership, attrs) do
    ownership
    |> Ownership.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a ownership.

  ## Examples

      iex> delete_ownership(ownership)
      {:ok, %Ownership{}}

      iex> delete_ownership(ownership)
      {:error, %Ecto.Changeset{}}

  """
  def delete_ownership(%Ownership{} = ownership) do
    Repo.delete(ownership)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking ownership changes.

  ## Examples

      iex> change_ownership(ownership)
      %Ecto.Changeset{data: %Ownership{}}

  """
  def change_ownership(%Ownership{} = ownership, attrs \\ %{}) do
    Ownership.changeset(ownership, attrs)
  end
end
