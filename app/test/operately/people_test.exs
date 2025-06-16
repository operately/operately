defmodule Operately.PeopleTest do
  use Operately.DataCase

  alias Operately.People
  alias Operately.People.Person
  alias Operately.Blobs.Blob
  alias Operately.Companies.Company

  describe "people" do
    import Operately.PeopleFixtures
    import Operately.CompaniesFixtures

    @invalid_attrs %{full_name: nil, title: nil}

    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)

      {:ok, %{person: person}}
    end

    test "get_person!/1 returns the person with given id", ctx do
      assert People.get_person!(ctx.person.id) == ctx.person
    end

    @valid_company_attrs %{
      name: "some company"
    }

    @valid_person_attrs %{
      full_name: "some full_name",
      title: "some title",
      suspended: false
    }

    @valid_blob_attrs %{
      filename: "some_file.png",
      status: :uploaded,
      storage_type: :s3,
      content_type: "image/png",
      size: 1234
    }

    setup do
      {:ok, company} =
        %Company{}
        |> Company.changeset(@valid_company_attrs)
        |> Repo.insert()

      valid_person_attrs = Map.put(@valid_person_attrs, :company_id, company.id)
      {:ok, person} =
        %Person{}
        |> Person.changeset(valid_person_attrs)
        |> Repo.insert()

      valid_blob_attrs = Map.merge(@valid_blob_attrs, %{
        author_id: person.id,
        company_id: company.id
      })
      {:ok, blob} =
        %Blob{}
        |> Blob.changeset(valid_blob_attrs)
        |> Repo.insert()

      %{blob: blob}
    end

    test "create_person/1 with valid data creates a person", ctx do
      valid_attrs = %{
        full_name: "some full_name",
        title: "some title",
        company_id: ctx.person.company_id,
        avatar_blob_id: ctx.blob.id
      }

      assert {:ok, %Person{} = person} = People.create_person(valid_attrs)
      assert person.full_name == "some full_name"
      assert person.title == "some title"
    end

    test "create_person/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = People.create_person(@invalid_attrs)
    end

    test "update_person/2 with valid data updates the person", ctx do
      update_attrs = %{
        full_name: "some updated full_name",
        title: "some updated title"
      }

      assert {:ok, %Person{} = person} = People.update_person(ctx.person, update_attrs)
      assert person.full_name == "some updated full_name"
      assert person.title == "some updated title"
    end

    test "update_person/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = People.update_person(ctx.person, @invalid_attrs)
      assert ctx.person == People.get_person!(ctx.person.id)
    end

    test "update_person/3 with valid avatar_blob_id updates the person", %{person: person, blob: blob} do
      update_attrs = %{
        full_name: "some updated full_name",
        title: "some updated title",
        avatar_blob_id: blob.id
      }

      assert {:ok, %Person{} = updated_person} = People.update_person(person, update_attrs)
      assert updated_person.full_name == "some updated full_name"
      assert updated_person.title == "some updated title"
      assert updated_person.avatar_blob_id == blob.id
    end

    test "change_person/1 returns a person changeset", ctx do
      assert %Ecto.Changeset{} = People.change_person(ctx.person)
    end
  end

  import Operately.PeopleFixtures
  alias Operately.People.{Account, AccountToken}

  describe "get_account_by_email/1" do
    test "does not return the account if the email does not exist" do
      refute People.get_account_by_email("unknown@example.com")
    end

    test "returns the account if the email exists" do
      %{id: id} = account = account_fixture()
      assert %Account{id: ^id} = People.get_account_by_email(account.email)
    end
  end

  describe "get_account_by_email_and_password/2" do
    test "does not return the account if the email does not exist" do
      refute People.get_account_by_email_and_password("unknown@example.com", "hello world!")
    end

    test "does not return the account if the password is not valid" do
      account = account_fixture()
      refute People.get_account_by_email_and_password(account.email, "invalid")
    end

    test "returns the account if the email and password are valid" do
      %{id: id} = account = account_fixture()

      assert %Account{id: ^id} =
               People.get_account_by_email_and_password(account.email, valid_account_password())
    end
  end

  describe "get_account!/1" do
    test "raises if id is invalid" do
      assert_raise Ecto.NoResultsError, fn ->
        People.get_account!("11111111-1111-1111-1111-111111111111")
      end
    end

    test "returns the account with the given id" do
      %{id: id} = account = account_fixture()
      assert %Account{id: ^id} = People.get_account!(account.id)
    end
  end

  describe "register_account/1" do
    test "requires email and password to be set" do
      {:error, changeset} = People.register_account(%{})

      assert %{
               password: ["can't be blank"],
               email: ["can't be blank"]
             } = errors_on(changeset)
    end

    test "validates email and password when given" do
      {:error, changeset} = People.register_account(%{email: "not valid", password: "not valid"})

      assert %{
               email: ["must have the @ sign and no spaces"],
               password: ["should be at least 12 character(s)"]
             } = errors_on(changeset)
    end

    test "validates maximum values for email and password for security" do
      too_long = String.duplicate("db", 100)
      {:error, changeset} = People.register_account(%{email: too_long, password: too_long})
      assert "should be at most 160 character(s)" in errors_on(changeset).email
      assert "should be at most 72 character(s)" in errors_on(changeset).password
    end

    test "validates email uniqueness" do
      %{email: email} = account_fixture()
      {:error, changeset} = People.register_account(%{email: email})
      assert "has already been taken" in errors_on(changeset).email

      # Now try with the upper cased email too, to check that email case is ignored.
      {:error, changeset} = People.register_account(%{email: String.upcase(email)})
      assert "has already been taken" in errors_on(changeset).email
    end

    test "registers accounts with a hashed password" do
      email = unique_account_email()
      {:ok, account} = People.register_account(valid_account_attributes(email: email))
      assert account.email == email
      assert is_binary(account.hashed_password)
      assert is_nil(account.confirmed_at)
      assert is_nil(account.password)
    end
  end

  describe "change_account_registration/2" do
    test "returns a changeset" do
      assert %Ecto.Changeset{} = changeset = People.change_account_registration(%Account{})
      assert changeset.required == [:full_name, :password, :email]
    end

    test "allows fields to be set" do
      email = unique_account_email()
      password = valid_account_password()

      changeset =
        People.change_account_registration(
          %Account{},
          valid_account_attributes(email: email, password: password)
        )

      assert changeset.valid?
      assert get_change(changeset, :email) == email
      assert get_change(changeset, :password) == password
      assert is_nil(get_change(changeset, :hashed_password))
    end
  end

  describe "change_account_email/2" do
    test "returns a account changeset" do
      assert %Ecto.Changeset{} = changeset = People.change_account_email(%Account{})
      assert changeset.required == [:email]
    end
  end

  describe "apply_account_email/3" do
    setup do
      %{account: account_fixture()}
    end

    test "requires email to change", %{account: account} do
      {:error, changeset} = People.apply_account_email(account, valid_account_password(), %{})
      assert %{email: ["did not change"]} = errors_on(changeset)
    end

    test "validates email", %{account: account} do
      {:error, changeset} =
        People.apply_account_email(account, valid_account_password(), %{email: "not valid"})

      assert %{email: ["must have the @ sign and no spaces"]} = errors_on(changeset)
    end

    test "validates maximum value for email for security", %{account: account} do
      too_long = String.duplicate("db", 100)

      {:error, changeset} =
        People.apply_account_email(account, valid_account_password(), %{email: too_long})

      assert "should be at most 160 character(s)" in errors_on(changeset).email
    end

    test "validates email uniqueness", %{account: account} do
      %{email: email} = account_fixture()
      password = valid_account_password()

      {:error, changeset} = People.apply_account_email(account, password, %{email: email})

      assert "has already been taken" in errors_on(changeset).email
    end

    test "validates current password", %{account: account} do
      {:error, changeset} =
        People.apply_account_email(account, "invalid", %{email: unique_account_email()})

      assert %{current_password: ["is not valid"]} = errors_on(changeset)
    end

    test "applies the email without persisting it", %{account: account} do
      email = unique_account_email()
      {:ok, account} = People.apply_account_email(account, valid_account_password(), %{email: email})
      assert account.email == email
      assert People.get_account!(account.id).email != email
    end
  end

  describe "change_account_password/2" do
    test "returns a account changeset" do
      assert %Ecto.Changeset{} = changeset = People.change_account_password(%Account{})
      assert changeset.required == [:password]
    end

    test "allows fields to be set" do
      changeset =
        People.change_account_password(%Account{}, %{
          "password" => "new valid password"
        })

      assert changeset.valid?
      assert get_change(changeset, :password) == "new valid password"
      assert is_nil(get_change(changeset, :hashed_password))
    end
  end

  describe "update_account_password/3" do
    setup do
      %{account: account_fixture()}
    end

    test "validates password", %{account: account} do
      {:error, changeset} =
        People.update_account_password(account, valid_account_password(), %{
          password: "not valid",
          password_confirmation: "another"
        })

      assert %{
               password: ["should be at least 12 character(s)"],
               password_confirmation: ["does not match password"]
             } = errors_on(changeset)
    end

    test "validates maximum values for password for security", %{account: account} do
      too_long = String.duplicate("db", 100)

      {:error, changeset} =
        People.update_account_password(account, valid_account_password(), %{password: too_long})

      assert "should be at most 72 character(s)" in errors_on(changeset).password
    end

    test "validates current password", %{account: account} do
      {:error, changeset} =
        People.update_account_password(account, "invalid", %{password: valid_account_password()})

      assert %{current_password: ["is not valid"]} = errors_on(changeset)
    end

    test "updates the password", %{account: account} do
      {:ok, account} =
        People.update_account_password(account, valid_account_password(), %{
          password: "new valid password"
        })

      assert is_nil(account.password)
      assert People.get_account_by_email_and_password(account.email, "new valid password")
    end

    test "deletes all tokens for the given account", %{account: account} do
      _ = People.generate_account_session_token(account)

      {:ok, _} =
        People.update_account_password(account, valid_account_password(), %{
          password: "new valid password"
        })

      refute Repo.get_by(AccountToken, account_id: account.id)
    end
  end

  describe "generate_account_session_token/1" do
    setup do
      %{account: account_fixture()}
    end

    test "generates a token", %{account: account} do
      token = People.generate_account_session_token(account)
      assert account_token = Repo.get_by(AccountToken, token: token)
      assert account_token.context == "session"

      # Creating the same token for another account should fail
      assert_raise Ecto.ConstraintError, fn ->
        Repo.insert!(%AccountToken{
          token: account_token.token,
          account_id: account_fixture().id,
          context: "session"
        })
      end
    end
  end

  describe "get_account_by_session_token/1" do
    setup do
      account = account_fixture()
      token = People.generate_account_session_token(account)
      %{account: account, token: token}
    end

    test "returns account by token", %{account: account, token: token} do
      assert session_account = People.get_account_by_session_token(token)
      assert session_account.id == account.id
    end

    test "does not return account for invalid token" do
      refute People.get_account_by_session_token("oops")
    end

    test "does not return account for expired token", %{token: token} do
      {1, nil} = Repo.update_all(AccountToken, set: [inserted_at: ~N[2020-01-01 00:00:00]])
      refute People.get_account_by_session_token(token)
    end
  end

  describe "delete_account_session_token/1" do
    test "deletes the token" do
      account = account_fixture()
      token = People.generate_account_session_token(account)
      assert People.delete_account_session_token(token) == :ok
      refute People.get_account_by_session_token(token)
    end
  end

  describe "reset_account_password/2" do
    setup do
      %{account: account_fixture()}
    end

    test "validates maximum values for password for security", %{account: account} do
      too_long = String.duplicate("db", 100)
      {:error, changeset} = People.reset_account_password(account, %{password: too_long})
      assert "should be at most 72 character(s)" in errors_on(changeset).password
    end

    test "updates the password", %{account: account} do
      {:ok, updated_account} = People.reset_account_password(account, %{password: "new valid password"})
      assert is_nil(updated_account.password)
      assert People.get_account_by_email_and_password(account.email, "new valid password")
    end

    test "deletes all tokens for the given account", %{account: account} do
      _ = People.generate_account_session_token(account)
      {:ok, _} = People.reset_account_password(account, %{password: "new valid password"})
      refute Repo.get_by(AccountToken, account_id: account.id)
    end
  end

  describe "inspect/2 for the Account module" do
    test "does not include password" do
      refute inspect(%Account{password: "123456"}) =~ "password: \"123456\""
    end
  end

  describe "manager relationship cycle prevention" do
    import Operately.PeopleFixtures
    import Operately.CompaniesFixtures

    setup do
      company = company_fixture()
      alice = person_fixture(%{full_name: "Alice", company_id: company.id})
      bob = person_fixture(%{full_name: "Bob", company_id: company.id})
      carol = person_fixture(%{full_name: "Carol", company_id: company.id})
      dave = person_fixture(%{full_name: "Dave", company_id: company.id})

      {:ok, %{company: company, alice: alice, bob: bob, carol: carol, dave: dave}}
    end

    test "can set a manager when there is no cycle", %{alice: alice, bob: bob, carol: carol} do
      # Create a valid management chain: Carol -> Bob -> Alice
      {:ok, bob_with_manager} = People.update_person(bob, %{manager_id: alice.id})
      assert bob_with_manager.manager_id == alice.id

      {:ok, carol_with_manager} = People.update_person(carol, %{manager_id: bob.id})
      assert carol_with_manager.manager_id == bob.id
    end

    test "cannot set a person as their own manager", %{alice: alice} do
      assert_raise Postgrex.Error, ~r/Cycle detected: setting this manager would create a circular reference/, fn ->
        People.update_person(alice, %{manager_id: alice.id})
      end
    end

    test "cannot create a cycle in the management chain", %{alice: alice, bob: bob, carol: carol} do
      # First create a valid chain: Carol -> Bob -> Alice
      {:ok, _bob_with_manager} = People.update_person(bob, %{manager_id: alice.id})
      {:ok, _carol_with_manager} = People.update_person(carol, %{manager_id: bob.id})

      # Now try to create a cycle by setting Alice's manager to Carol
      assert_raise Postgrex.Error, ~r/Cycle detected: setting this manager would create a circular reference/, fn ->
        People.update_person(alice, %{manager_id: carol.id})
      end
    end

    test "can change manager to someone else without creating a cycle", %{alice: alice, bob: bob, carol: carol, dave: dave} do
      # First create a valid chain: Carol -> Bob -> Alice
      {:ok, _bob_with_manager} = People.update_person(bob, %{manager_id: alice.id})
      {:ok, _carol_with_manager} = People.update_person(carol, %{manager_id: bob.id})

      # Now change Carol's manager to Dave (breaking the chain)
      {:ok, carol_with_new_manager} = People.update_person(carol, %{manager_id: dave.id})
      assert carol_with_new_manager.manager_id == dave.id

      # And now Alice can have Bob as manager (which was not possible before)
      {:ok, alice_with_manager} = People.update_person(alice, %{manager_id: dave.id})
      assert alice_with_manager.manager_id == dave.id
    end
  end
end
