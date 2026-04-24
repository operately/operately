defmodule Operately.CompanyTransfers.Import.RowDeserializerTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.RowDeserializer

  test "deserializes bytea values into binaries for Ecto casting" do
    value = <<0, 1, 2, 255>>

    assert RowDeserializer.deserialize_row(%{
             "token_hash" => %{
               "__type__" => "bytea",
               "encoding" => "base64",
               "value" => Base.encode64(value)
             }
           }) == %{"token_hash" => value}
  end
end
