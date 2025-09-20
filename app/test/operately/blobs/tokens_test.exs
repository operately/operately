defmodule Operately.Blobs.TokensTest do
  use Operately.DataCase

  alias Operately.Blobs.Tokens

  test "encryption and validation" do
    token = Tokens.gen_upload_token("test.txt") 

    assert Tokens.validate("upload", "test.txt", token) == :ok
  end

  test "returns error on garbage data" do
    token = "garbage"

    assert Tokens.validate("upload", "test.txt", token) == {:error, :invalid_token}
  end

  test "returns error even for base64 valid garbage" do
    token = Base.encode64("garbage")

    assert Tokens.validate("upload", "test.txt", token) == {:error, :invalid_token}
  end
end
