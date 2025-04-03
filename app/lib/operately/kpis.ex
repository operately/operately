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

  alias Operately.Kpis.Metric

  @doc """
  Returns the list of kpi_metrics.

  ## Examples

      iex> list_kpi_metrics()
      [%Metric{}, ...]

  """
  def list_kpi_metrics do
    Repo.all(Metric)
  end

  @doc """
  Gets a single metric.

  Raises `Ecto.NoResultsError` if the Metric does not exist.

  ## Examples

      iex> get_metric!(123)
      %Metric{}

      iex> get_metric!(456)
      ** (Ecto.NoResultsError)

  """
  def get_metric!(id), do: Repo.get!(Metric, id)

  def get_metrics(kpi, limit \\ 12) do
    from(m in Metric, where: m.kpi_id == ^kpi.id, order_by: [asc: m.date], limit: ^limit)
    |> Repo.all()
  end

  @doc """
  Creates a metric.

  ## Examples

      iex> create_metric(%{field: value})
      {:ok, %Metric{}}

      iex> create_metric(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_metric(attrs \\ %{}) do
    %Metric{}
    |> Metric.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a metric.

  ## Examples

      iex> update_metric(metric, %{field: new_value})
      {:ok, %Metric{}}

      iex> update_metric(metric, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_metric(%Metric{} = metric, attrs) do
    metric
    |> Metric.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a metric.

  ## Examples

      iex> delete_metric(metric)
      {:ok, %Metric{}}

      iex> delete_metric(metric)
      {:error, %Ecto.Changeset{}}

  """
  def delete_metric(%Metric{} = metric) do
    Repo.delete(metric)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking metric changes.

  ## Examples

      iex> change_metric(metric)
      %Ecto.Changeset{data: %Metric{}}

  """
  def change_metric(%Metric{} = metric, attrs \\ %{}) do
    Metric.changeset(metric, attrs)
  end
end
