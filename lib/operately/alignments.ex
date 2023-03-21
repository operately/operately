defmodule Operately.Alignments do
  @moduledoc """
  The Alignments context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Alignments.Alignment

  @doc """
  Returns the list of alignments.

  ## Examples

      iex> list_alignments()
      [%Alignment{}, ...]

  """
  def list_alignments do
    Repo.all(Alignment)
  end

  @doc """
  Creates a alignment.

  ## Examples

      iex> create_alignment(%{field: value})
      {:ok, %Alignment{}}

      iex> create_alignment(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_alignment(attrs \\ %{}) do
    %Alignment{}
    |> Alignment.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking alignment changes.

  ## Examples

      iex> change_alignment(alignment)
      %Ecto.Changeset{data: %Alignment{}}

  """
  def change_alignment(%Alignment{} = alignment, attrs \\ %{}) do
    Alignment.changeset(alignment, attrs)
  end
end
