defmodule Operately.Support.EmailChange.Helpers do
  import ExUnit.Assertions
  alias Operately.People.EmailChange

  def request_new_email(account, email) do
    {:ok, request} = EmailChange.request(account, email)
    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}
    EmailChange.verify_current(account, request.id, code)
  end
end
