defmodule Operately.SiteMessages do
  @moduledoc """
  Site-wide messages shown to company users as dismissible banners.
  """

  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias Operately.Companies.Company
  alias Operately.Repo
  alias Operately.SiteMessages.{SiteMessage, SiteMessageCompany}

  def list_all do
    SiteMessage
    |> order_by([m], desc: m.inserted_at)
    |> Repo.all()
    |> load_company_ids()
  end

  def get!(id) do
    case get(id) do
      nil -> raise Ecto.NoResultsError, queryable: SiteMessage
      message -> message
    end
  end

  def get(id) do
    Repo.get(SiteMessage, id)
  end

  def list_active_for_company(%Company{} = company) do
    now = DateTime.utc_now()

    targeted_message_ids =
      from smc in SiteMessageCompany,
        where: smc.company_id == ^company.id,
        select: smc.site_message_id

    SiteMessage
    |> where([m], m.active == true)
    |> where([m], is_nil(m.expires_at) or m.expires_at > ^now)
    |> where([m], m.all_companies == true or m.id in subquery(targeted_message_ids))
    |> order_by([m], asc: m.inserted_at)
    |> Repo.all()
  end

  def create(attrs) do
    company_short_ids = Map.get(attrs, :company_ids, [])
    attrs = Map.drop(attrs, [:company_ids])

    with {:ok, company_ids} <- resolve_company_ids(company_short_ids) do
      Multi.new()
      |> Multi.insert(:message, SiteMessage.changeset(attrs))
      |> Multi.run(:companies, fn _repo, %{message: message} ->
        replace_company_associations(message, company_ids)
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{message: message}} -> {:ok, load_company_ids(message)}
        {:error, :message, changeset, _} -> {:error, changeset}
        {:error, _step, reason, _} -> {:error, reason}
      end
    end
  end

  def update(%SiteMessage{} = message, attrs) do
    message = load_company_ids(message)
    company_short_ids = Map.get(attrs, :company_ids)
    attrs = Map.drop(attrs, [:company_ids])

    with {:ok, company_ids} <- maybe_resolve_company_ids(company_short_ids) do
      Multi.new()
      |> Multi.update(:message, SiteMessage.changeset(message, attrs))
      |> Multi.run(:companies, fn _repo, %{message: updated} ->
        if is_nil(company_short_ids) do
          {:ok, :skipped}
        else
          replace_company_associations(updated, company_ids)
        end
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{message: updated}} -> {:ok, load_company_ids(updated)}
        {:error, :message, changeset, _} -> {:error, changeset}
        {:error, _step, reason, _} -> {:error, reason}
      end
    end
  end

  def delete(%SiteMessage{} = message) do
    Repo.delete(message)
  end

  defp maybe_resolve_company_ids(nil), do: {:ok, nil}

  defp maybe_resolve_company_ids(company_short_ids) do
    resolve_company_ids(company_short_ids)
  end

  defp resolve_company_ids([]), do: {:ok, []}

  defp resolve_company_ids(company_ids) do
    company_ids
    |> Enum.reduce_while({:ok, []}, fn company_id, {:ok, acc} ->
      with {:ok, short_id} <- OperatelyWeb.Api.Types.CompanyId.decode(company_id),
           {:ok, company} <- Company.get(:system, short_id: short_id) do
        {:cont, {:ok, [company.id | acc]}}
      else
        _ -> {:halt, {:error, :invalid_company_id}}
      end
    end)
    |> case do
      {:ok, ids} -> {:ok, Enum.reverse(ids)}
      error -> error
    end
  end

  # Replaces join-table audience rows; skips inserts when targeting all companies or none.
  defp replace_company_associations(%SiteMessage{} = message, company_ids) do
    from(smc in SiteMessageCompany, where: smc.site_message_id == ^message.id)
    |> Repo.delete_all()

    if message.all_companies or company_ids == [] do
      {:ok, :cleared}
    else
      company_ids
      |> Enum.reduce(Ecto.Multi.new(), fn company_id, multi ->
        Multi.insert(
          multi,
          {:company, company_id},
          SiteMessageCompany.changeset(%{
            site_message_id: message.id,
            company_id: company_id
          })
        )
      end)
      |> Repo.transaction()
      |> case do
        {:ok, _} -> {:ok, :inserted}
        {:error, _step, changeset, _} -> {:error, changeset}
      end
    end
  end

  # Hydrates the virtual company_ids field from join-table rows as encoded API IDs.
  def load_company_ids(messages) when is_list(messages) do
    Enum.map(messages, &load_company_ids/1)
  end

  def load_company_ids(%SiteMessage{} = message) do
    company_ids =
      if message.all_companies do
        []
      else
        from(smc in SiteMessageCompany,
          join: c in Company, on: c.id == smc.company_id,
          where: smc.site_message_id == ^message.id,
          select: {c.name, c.short_id},
          order_by: [asc: c.name]
        )
        |> Repo.all()
        |> Enum.map(fn {name, short_id} ->
          OperatelyWeb.Paths.company_id(%Company{name: name, short_id: short_id})
        end)
      end

    %{message | company_ids: company_ids}
  end
end
