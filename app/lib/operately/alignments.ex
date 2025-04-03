defmodule Operately.Alignments do
  @moduledoc """
  The Alignments context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Alignments.Alignment

  def list_parents(project = %Operately.Projects.Project{}) do
    objective = Repo.preload(project, [:objective]).objective

    list_parents(objective) ++ [%{title: objective.name, type: :objective, id: objective.id}]
  end

  def list_parents(objective = %Operately.Okrs.Objective{}) do
    tenet = Repo.preload(objective, [:tenet]).tenet

    list_parents(tenet) ++ [%{title: tenet.name, type: :tenet, id: tenet.id}]
  end

  def list_parents(tenet = %Operately.Tenets.Tenet{}) do
    company = Repo.preload(tenet, [:company]).company

    [%{title: company.name, type: :company, id: company.id }]
  end

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
