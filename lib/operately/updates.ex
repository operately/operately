defmodule Operately.Updates do
  @moduledoc """
  The Updates context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Updates.Update

  @doc """
  Returns the list of updates.

  ## Examples

      iex> list_updates()
      [%Update{}, ...]

  """
  def list_updates do
    Repo.all(Update)
  end

  def list_updates(updatable_id, updatable_type) do
    query = from u in Update,
      where: u.updatable_id == ^updatable_id,
      where: u.updatable_type == ^updatable_type

    Repo.all(query)
  end

  @doc """
  Gets a single update.

  Raises `Ecto.NoResultsError` if the Update does not exist.

  ## Examples

      iex> get_update!(123)
      %Update{}

      iex> get_update!(456)
      ** (Ecto.NoResultsError)

  """
  def get_update!(id), do: Repo.get!(Update, id)

  @doc """
  Creates a update.

  ## Examples

      iex> create_update(%{field: value})
      {:ok, %Update{}}

      iex> create_update(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_update(attrs \\ %{}) do
    %Update{}
    |> Update.changeset(attrs)
    |> Repo.insert()
    |> publish_update_added()
  end

  def publish_update_added({:ok, update}) do
    Absinthe.Subscription.publish(
      OperatelyWeb.Endpoint,
      update,
      update_added: "*")

    {:ok, update}
  end

  @doc """
  Updates a update.

  ## Examples

      iex> update_update(update, %{field: new_value})
      {:ok, %Update{}}

      iex> update_update(update, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_update(%Update{} = update, attrs) do
    update
    |> Update.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a update.

  ## Examples

      iex> delete_update(update)
      {:ok, %Update{}}

      iex> delete_update(update)
      {:error, %Ecto.Changeset{}}

  """
  def delete_update(%Update{} = update) do
    Repo.delete(update)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking update changes.

  ## Examples

      iex> change_update(update)
      %Ecto.Changeset{data: %Update{}}

  """
  def change_update(%Update{} = update, attrs \\ %{}) do
    Update.changeset(update, attrs)
  end
end
