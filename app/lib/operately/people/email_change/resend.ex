defmodule Operately.People.EmailChange.Resend do
  alias Operately.People.EmailChange.{DeliverCode, Shared}

  def run(account, request_id) do
    Shared.with_account_lock(account, fn account ->
      with {:ok, request} <- Shared.find_pending(account, request_id),
           :ok <- Shared.check_authorization(request),
           {:ok, _} <- Shared.validate_email(account, request.email),
           :ok <- Shared.check_send_limit(account) do
        DeliverCode.run(account, request.email, request.stage, request.current_email_verified_at)
      end
    end)
  end
end
