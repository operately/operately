defmodule Operately.People.EmailChange do
  import Ecto.Query

  alias Operately.People.Account
  alias Operately.People.EmailChange.{Cancel, Confirm, Request, Resend, Shared, VerifyCurrent}
  alias Operately.Repo

  @outcomes [:success, :invalid_email, :email_unchanged, :email_taken, :rate_limited, :delivery_unavailable, :delivery_failed, :request_invalid, :code_expired, :authorization_expired, :invalid_code, :too_many_attempts]

  defmodule State do
    def __api_typename__, do: "email_change_state"
    defstruct [:current_email, :pending, :retry_after]
  end

  def outcomes, do: @outcomes

  def state(account) do
    account = Repo.get!(Account, account.id)
    pending = Repo.one(from r in Shared.pending_query(account), where: r.original_email == ^account.email and not is_nil(r.stage))
    %State{current_email: account.email, pending: pending, retry_after: Shared.retry_after(account, Shared.now())}
  end

  defdelegate request(account, email), to: Request, as: :run
  defdelegate verify_current(account, request_id, code), to: VerifyCurrent, as: :run
  defdelegate resend(account, request_id), to: Resend, as: :run
  defdelegate confirm(account, request_id, code), to: Confirm, as: :run
  defdelegate cancel(account, request_id), to: Cancel, as: :run
end
