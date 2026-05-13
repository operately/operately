defmodule Operately.CompanyTransfers.Import.AccountResolver do
  @moduledoc """
  Resolves exported account rows to destination account IDs using email matching.
  """

  import Ecto.Query, only: [from: 2]
  require Logger

  alias Operately.CompanyTransfers.Import.Package
  alias Operately.People
  alias Operately.People.Account
  alias Operately.Repo

  def resolve(%Package{} = package) do
    Enum.reduce_while(Package.account_rows(package), {:ok, empty_resolution()}, fn account_row, {:ok, resolution} ->
      case resolve_account(account_row, resolution) do
        {:ok, resolution} -> {:cont, {:ok, resolution}}
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
  end

  def destination_account_ids(%{mapping: mapping}) when is_map(mapping) do
    mapping
    |> Map.values()
    |> Enum.uniq()
  end

  defp resolve_account(%{"id" => source_id, "email" => email} = account_row, resolution) when is_binary(source_id) and is_binary(email) do
    normalized_email = email |> String.trim() |> String.downcase()

    case find_destination_account(normalized_email) do
      %Account{} = account ->
        maybe_log_reused_deleted_account(account, normalized_email)

        {:ok,
         %{
           resolution
           | mapping: Map.put(resolution.mapping, source_id, account.id),
             reused_count: resolution.reused_count + 1
         }}

      nil ->
        attrs = %{
          email: normalized_email,
          full_name: account_row["full_name"] || normalized_email,
          password: random_password()
        }

        case People.register_account(attrs) do
          {:ok, account} ->
            {:ok,
             %{
               resolution
               | mapping: Map.put(resolution.mapping, source_id, account.id),
                 created_count: resolution.created_count + 1
             }}

          {:error, changeset} ->
            {:error, {:account_creation_failed, email, changeset}}
        end
    end
  end

  defp resolve_account(account_row, _resolution) do
    {:error, {:invalid_account_row, account_row}}
  end

  defp empty_resolution do
    %{
      mapping: %{},
      reused_count: 0,
      created_count: 0
    }
  end

  defp find_destination_account(normalized_email) do
    from(a in Account, where: a.email == ^normalized_email)
    |> Repo.one(with_deleted: deleted_placeholder_email?(normalized_email))
  end

  defp maybe_log_reused_deleted_account(%Account{deleted_at: deleted_at, id: account_id}, email) when not is_nil(deleted_at) do
    Logger.info("Reusing soft-deleted destination account #{account_id} for imported deleted placeholder email #{email}")
  end

  defp maybe_log_reused_deleted_account(_account, _email), do: :ok

  defp deleted_placeholder_email?(email) do
    String.starts_with?(email, "deleted+account-") and String.ends_with?(email, "@operately.invalid")
  end

  defp random_password do
    Base.url_encode64(:crypto.strong_rand_bytes(24), padding: false)
  end
end
