defmodule Operately.People.AccountTest do
  use Operately.DataCase
  alias Operately.People.Account

  defp signup(attrs) do
    Account.signup_changeset(Map.merge(%{email: "new@example.com", full_name: "New User", password: "ValidPassword123"}, attrs))
  end

  test "normalizes email and name without hashing or retaining a hash" do
    cs = signup(%{email: "  NEW@Example.COM  ", full_name: "  New User  "})
    assert cs.valid?
    assert Ecto.Changeset.get_field(cs, :email) == "new@example.com"
    assert Ecto.Changeset.get_field(cs, :full_name) == "New User"
    refute Ecto.Changeset.get_field(cs, :hashed_password)
  end

  test "email storage counts normalized Unicode code points" do
    for size <- [160, 161, 255] do
      assert signup(%{email: String.duplicate("a", size - 5) <> "@b.co"}).valid?
    end

    refute signup(%{email: String.duplicate("a", 251) <> "@b.co"}).valid?
    assert signup(%{email: String.duplicate("é", 125) <> "@b.co"}).valid?
    refute signup(%{email: String.duplicate("é", 126) <> "@b.co"}).valid?
    assert signup(%{email: String.duplicate("😀", 250) <> "@b.co"}).valid?
  end

  test "rejects missing fields and malformed addresses" do
    for email <- [nil, "", "a@b", "a@@b.co", "a b@c.co", "a@.co", "a@b."] do
      assert %{email: [_ | _]} = errors_on(signup(%{email: email}))
    end

    assert %{full_name: [_ | _]} = errors_on(signup(%{full_name: "  "}))
    assert %{password: [_ | _]} = errors_on(signup(%{password: nil}))
  end

  test "name storage counts code points" do
    assert signup(%{full_name: String.duplicate("😀", 255)}).valid?
    refute signup(%{full_name: String.duplicate("😀", 256)}).valid?
  end

  test "password minimum uses UTF-16 units and complexity is required" do
    for password <- ["ShortPass1", "alllowercase1", "ALLUPPERCASE1", "WithoutNumbers", "            "] do
      assert %{password: [_ | _]} = errors_on(signup(%{password: password}))
    end

    assert signup(%{password: "Aa1" <> String.duplicate("😀", 5)}).valid?
    refute signup(%{password: "Aa1" <> String.duplicate("😀", 4)}).valid?
  end

  test "password byte bound is enforced without hashing for ASCII and multibyte input" do
    for {valid, invalid} <- [
          {"Aa1" <> String.duplicate("a", 69), "Aa1" <> String.duplicate("a", 70)},
          {"Aa1a" <> String.duplicate("😀", 17), "Aa1aa" <> String.duplicate("😀", 17)}
        ] do
      assert signup(%{password: valid}).valid?
      assert %{password: [_ | _]} = errors_on(signup(%{password: invalid}))
      cs = Account.registration_changeset(%Account{}, %{email: "new@example.com", full_name: "New", password: invalid})
      refute cs.valid?
      refute Ecto.Changeset.get_field(cs, :hashed_password)
    end
  end

  test "normalization uses Unicode whitespace and context-independent lowercasing" do
    cs = signup(%{email: "\u0085ΟΣİ@example.com\u00A0", full_name: "\u0085New User\u00A0"})
    assert cs.valid?
    assert Ecto.Changeset.get_field(cs, :email) == "οσi̇@example.com"
    assert Ecto.Changeset.get_field(cs, :full_name) == "New User"
    refute signup(%{email: "a\u0085b@example.com"}).valid?
  end

  test "signup never transforms a valid password and internal passwords do not require signup complexity" do
    password = "  Password1234  "
    cs = signup(%{password: password})
    assert cs.valid?
    assert Ecto.Changeset.get_field(cs, :password) == password
    internal = Account.registration_changeset(%Account{}, %{email: "internal@example.com", full_name: "Internal", password: "generatedpassword"}, hash_password: false)
    assert internal.valid?
    reset = Account.password_changeset(%Account{}, %{password: "resetpassword"}, hash_password: false)
    assert reset.valid?
  end
  test "signup rejects an email still reserved by a deleted account" do
    ctx = Factory.add_account(%{}, :existing)
    ctx.existing |> change(deleted_at: DateTime.utc_now()) |> Repo.update!()
    assert %{email: [_ | _]} = errors_on(signup(%{email: "  " <> String.upcase(ctx.existing.email) <> "  "}))
  end

end
