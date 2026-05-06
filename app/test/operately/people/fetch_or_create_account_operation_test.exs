defmodule Operately.People.FetchOrCreateAccountOperationTest do
  use OperatelyWeb.TurboCase

  import Operately.BlobsFixtures
  import Operately.PeopleFixtures

  describe "avatar syncing" do
    setup :register_and_log_in_account

    test "keeps custom avatars when account logs in via google", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})
      custom_url = Operately.Blobs.Blob.url(blob)

      {:ok, _} = Operately.People.update_person(ctx.person, %{avatar_blob_id: blob.id, avatar_url: custom_url})

      attrs = %{email: ctx.account.email, name: ctx.account.full_name, image: "https://example.com/google.png"}
      assert {:ok, _account, :existing} = Operately.People.FetchOrCreateAccountOperation.call(attrs)

      person = Operately.People.get_person!(ctx.person.id)
      assert person.avatar_blob_id == blob.id
      assert person.avatar_url == custom_url
    end

    test "updates avatar when no custom blob exists", ctx do
      attrs = %{email: ctx.account.email, name: ctx.account.full_name, image: "https://example.com/google.png"}
      assert {:ok, _account, :existing} = Operately.People.FetchOrCreateAccountOperation.call(attrs)

      person = Operately.People.get_person!(ctx.person.id)
      assert person.avatar_url == "https://example.com/google.png"
    end
  end

  describe "account lookup source" do
    setup :register_and_log_in_account

    test "returns :existing when the account already exists", ctx do
      attrs = %{email: ctx.account.email, name: ctx.account.full_name, image: "https://example.com/google.png"}

      assert {:ok, account, :existing} = Operately.People.FetchOrCreateAccountOperation.call(attrs)
      assert account.id == ctx.account.id
    end

    test "returns :created when it creates a new account" do
      email = unique_account_email()
      attrs = %{email: email, name: "New Account", image: "https://example.com/google.png"}

      assert {:ok, account, :created} = Operately.People.FetchOrCreateAccountOperation.call(attrs)
      assert account.email == email
      assert account.full_name == "New Account"

      persisted_account = Operately.People.get_account_by_email(email)
      assert persisted_account.id == account.id
    end
  end
end
