defmodule Operately.PeopleFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.People` context.
  """

  def person_fixture(attrs \\ %{}) do
    {:ok, person} =
      attrs
      |> Enum.into(%{
        full_name: "some full_name",
        title: "some title",
        email: "some-email@localhost",
        send_daily_summary: true,
        notify_on_mention: true,
        notify_about_assignments: true
      })
      |> Operately.People.create_person()

    person
  end

  def person_fixture_with_account(attrs \\ %{}) do
    email = attrs[:email] || unique_account_email(attrs[:full_name])
    password = attrs[:password] || valid_account_password()

    account = account_fixture(%{
      email: email, 
      password: password,
      full_name: attrs[:full_name] || "John Doe"
    })

    person_fixture(Map.merge(attrs, %{account_id: account.id, email: email}))
  end

  def unique_account_email(), do: "account#{System.unique_integer()}@example.com"
  def unique_account_email(nil), do: unique_account_email()
  def unique_account_email(full_name) do
    sanitized_name = String.replace(full_name, " ", "-") |> String.downcase()

    "#{sanitized_name}#{System.unique_integer()}@example.com"
  end

  def valid_account_password, do: "hello world!"

  def valid_account_attributes(attrs \\ %{}) do
    Enum.into(attrs, %{
      email: unique_account_email(),
      password: valid_account_password(),
      full_name: "Kjell Morgenstern"
    })
  end

  def account_fixture(attrs \\ %{}) do
    {:ok, account} =
      attrs
      |> valid_account_attributes()
      |> Operately.People.register_account()

    account
  end

  def extract_account_token(fun) do
    {:ok, captured_email} = fun.(&"[TOKEN]#{&1}[TOKEN]")
    [_, token | _] = String.split(captured_email.text_body, "[TOKEN]")
    token
  end

end
