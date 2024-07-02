defmodule Operately.Companies.ShortIdTest do
  use Operately.DataCase

  import Operately.Companies.ShortId, only: [generate: 0, encode: 1, decode: 1]

  alias Operately.Companies.Company

  test "generate" do
    companies = 0..99 |> Enum.map(fn i -> 
      Company.changeset(%{name: "Company #{i}", short_id: generate()}) |> Repo.insert!()
    end)

    Enum.each(companies, fn company ->
      assert company.short_id >= 1024
      assert company.short_id <= 18446744073709551615
      assert String.length(encode(company.short_id)) == 3
    end)

    Enum.each(1..99, fn index ->
      assert Enum.at(companies, index).short_id > Enum.at(companies, index - 1).short_id
    end)
  end

  test "conversion" do
    assert encode(0) == "a"
    assert encode(1023) == "99"
    assert encode(1024) == "baa"
    assert encode(1025) == "bab"

    assert decode("a") == {:ok, 0}
    assert decode("99") == {:ok, 1023}  
    assert decode("baa") == {:ok, 1024}
    assert decode("bab") == {:ok, 1025}

    assert decode("Z") == :error
  end
end
