defmodule Operately.People.EmailChange.VerifyCurrent do
  alias Operately.People.EmailChange.{DeliverCode, Shared}

  def run(account, request_id, code) do
    Shared.with_account_lock(account, fn account ->
      with {:ok, request} <- Shared.find_pending(account, request_id),
           :ok <- Shared.check_stage(request, :current_email),
           :ok <- Shared.check_validity(request),
           :ok <- Shared.verify_code(request, code),
           {:ok, _} <- Shared.validate_email(account, request.email),
           :ok <- Shared.check_send_limit(account, skip_cooldown: true) do
        DeliverCode.run(account, request.email, :new_email, Shared.now())
      end
    end)
  end
end
