defmodule Operately.Alignments do
  @moduledoc """
  The Alignments context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Alignments.Alignment


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
