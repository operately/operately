defmodule OperatelyEE.AccountOnboardingJob do
  use Oban.Worker
  alias Operately.People.Account

  def perform(job) do
    with(
      {:ok, account} = Account.get(:system, id: job["account_id"]),
      :ok <- add_to_saas_onboarding_email_list(account.email)
    ) do
    end
  end

  def add_to_saas_onboarding_email_list(email) do
    # Add the email to the list
    # TODO
    IO.inspect("Adding #{email} to the list")
  end
end
