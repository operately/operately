defmodule Operately.People.EmailChange.CancelTest do
  use Operately.DataCase

  alias Operately.People.EmailChange.Cancel
  alias Operately.People.EmailChange
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "only the requesting account can confirm or cancel", ctx do
    ctx = Factory.add_account(ctx, :other)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    assert {:error, :request_invalid} = EmailChange.confirm(ctx.other, request.id, code)
    assert {:error, :request_invalid} = Cancel.run(ctx.other, request.id)
    assert :ok = EmailChange.confirm(ctx.account, request.id, code)
  end

  test "expired and cancelled codes do not change email", ctx do
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    request |> Ecto.Changeset.change(expires_at: DateTime.add(DateTime.utc_now(), -1) |> DateTime.truncate(:second)) |> Repo.update!()
    assert {:error, :code_expired} = EmailChange.confirm(ctx.account, request.id, code)
    assert :ok = Cancel.run(ctx.account, request.id)
    assert is_nil(EmailChange.state(ctx.account).pending)
    assert {:error, :request_invalid} = EmailChange.confirm(ctx.account, request.id, code)
  end

  defp delivered_code do
    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}
    String.replace(code, "-", "")
  end
end
