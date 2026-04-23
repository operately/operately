defmodule Operately.CompanyTransfers.Import.AccountResolver do
  @moduledoc """
  Resolves exported account rows to destination account IDs using email matching.
  """

  alias Operately.CompanyTransfers.Import.Package
  alias Operately.People
  alias Operately.People.Account
  alias Operately.Repo

  def resolve(%Package{} = package) do
    Enum.reduce(Package.account_rows(package), {:ok, empty_resolution()}, fn account_row, {:ok, resolution} ->
      resolve_account(account_row, resolution)
    end)
  end

  def status_by_destination_account(%{resolved_accounts: resolved_accounts}) when is_map(resolved_accounts) do
    Map.new(resolved_accounts, fn {_source_id, resolution} ->
      {resolution.destination_account_id, resolution.status}
    end)
  end

  defp resolve_account(%{"id" => source_id, "email" => email} = account_row, resolution) when is_binary(source_id) and is_binary(email) do
    normalized_email = email |> String.trim() |> String.downcase()

    case Repo.get_by(Account, email: normalized_email) do
      %Account{} = account ->
        {:ok,
         %{
           resolution
           | mapping: Map.put(resolution.mapping, source_id, account.id),
             resolved_accounts: put_resolution(resolution.resolved_accounts, source_id, account.id, normalized_email, :reused),
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
                 resolved_accounts: put_resolution(resolution.resolved_accounts, source_id, account.id, normalized_email, :created),
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
      resolved_accounts: %{},
      reused_count: 0,
      created_count: 0
    }
  end

  defp put_resolution(resolved_accounts, source_id, destination_account_id, email, status) do
    Map.put(resolved_accounts, source_id, %{
      destination_account_id: destination_account_id,
      email: email,
      status: status
    })
  end

  defp random_password do
    Base.url_encode64(:crypto.strong_rand_bytes(24), padding: false)
  end
end
