defmodule Operately.CompanyTransfers.Import.AccountResolverTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Import.{AccountResolver, Package}
  alias Operately.Operations.AccountDeleting
  alias Operately.People.Account

  test "resolve/1 returns the first invalid account row error instead of crashing" do
    invalid_row = %{"id" => Ecto.UUID.generate()}
    valid_row = %{"id" => Ecto.UUID.generate(), "email" => "valid@example.com"}

    assert {:error, {:invalid_account_row, ^invalid_row}} =
             package_with_account_rows([invalid_row, valid_row])
             |> AccountResolver.resolve()
  end

  test "resolve/1 reuses soft-deleted accounts for deleted placeholder emails", ctx do
    ctx = Factory.add_account(ctx, :loose_account)

    assert {:ok, _deleted_account} = AccountDeleting.run(Repo.get!(Account, ctx.loose_account.id))

    source_id = Ecto.UUID.generate()
    deleted_email = "deleted+account-#{ctx.loose_account.id}@operately.invalid"

    assert {:ok, resolution} =
             package_with_account_rows([
               %{"id" => source_id, "email" => deleted_email}
             ])
             |> AccountResolver.resolve()

    assert resolution.mapping == %{source_id => ctx.loose_account.id}
    assert resolution.reused_count == 1
    assert resolution.created_count == 0
  end

  defp package_with_account_rows(rows) do
    accounts_table = %{"name" => "accounts", "rows" => rows}

    %Package{
      manifest: %{},
      tables: [accounts_table],
      table_map: %{"accounts" => accounts_table},
      files: []
    }
  end
end
