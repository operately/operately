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
  Returns an `%Ecto.Changeset{}` for tracking alignment changes.

  ## Examples

      iex> change_alignment(alignment)
      %Ecto.Changeset{data: %Alignment{}}

  """
  def change_alignment(%Alignment{} = alignment, attrs \\ %{}) do
    Alignment.changeset(alignment, attrs)
  end
end
