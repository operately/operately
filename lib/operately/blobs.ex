defmodule Operately.Blobs do
  @moduledoc """
  The Blobs context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Blobs.Blob

  @doc """
  Returns the list of blobs.

  ## Examples

      iex> list_blobs()
      [%Blob{}, ...]

  """
  def list_blobs do
    Repo.all(Blob)
  end

  @doc """
  Gets a single blob.

  Raises `Ecto.NoResultsError` if the Blob does not exist.

  ## Examples

      iex> get_blob!(123)
      %Blob{}

      iex> get_blob!(456)
      ** (Ecto.NoResultsError)

  """
  def get_blob!(id), do: Repo.get!(Blob, id)

  @doc """
  Creates a blob.

  ## Examples

      iex> create_blob(%{field: value})
      {:ok, %Blob{}}

      iex> create_blob(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_blob(attrs \\ %{}) do
    %Blob{}
    |> Blob.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a blob.

  ## Examples

      iex> update_blob(blob, %{field: new_value})
      {:ok, %Blob{}}

      iex> update_blob(blob, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_blob(%Blob{} = blob, attrs) do
    blob
    |> Blob.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a blob.

  ## Examples

      iex> delete_blob(blob)
      {:ok, %Blob{}}

      iex> delete_blob(blob)
      {:error, %Ecto.Changeset{}}

  """
  def delete_blob(%Blob{} = blob) do
    Repo.delete(blob)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking blob changes.

  ## Examples

      iex> change_blob(blob)
      %Ecto.Changeset{data: %Blob{}}

  """
  def change_blob(%Blob{} = blob, attrs \\ %{}) do
    Blob.changeset(blob, attrs)
  end
end
