defmodule OperatelyWeb.Certification do
  @moduledoc """
  Operately can fetch and renew TLS certificates from Let's Encrypt.
  """ 

  def directory_url do
    case Application.get_env(:operately, :app_env) do
      :prod -> "https://acme-v02.api.letsencrypt.org/directory"
      :dev -> {:internal, port: 4003}
      :test -> {:internal, port: 4004}
    end
  end

  def domain, do: System.get_env("CERT_DOMAIN")
  def emails, do: System.get_env("CERT_EMAILS", "") |> String.split(",")
  def folder, do: System.get_env("CERT_DB_DIR")

  def mode do 
    if System.get_env("CERT_AUTO_RENEW") == "yes" do
      :auto
    else
      :manual
    end
  end

  @lets_encrypt "Let's Encrypt"

  @spec status() :: :ready | :not_ready
  def status do
    if mode() == :auto do
      if find_issuer_name() == @lets_encrypt do
        :ready
      else
        :not_ready
      end
    else
      :ready
    end
  end

  def verify_config_presence do
    if mode() != :manual do
      unless domain() do
        raise """
        You need to set the CERT_DOMAIN environment variable to run Operately with TLS support.
        """
      end

      unless folder() do
        raise """
        You need to set the CERT_DB_DIR environment variable, where the certificates will be stored. 
        Make sure this is outside of the deployment folder. Otherwise, the deploy may delete the 
        folder, which will effectively remove the generated key and certificate files.
        """
      end

      unless File.exists?(folder()) do
        raise """
        The folder specified in CERT_DB_DIR does not exist. Please create it before starting the server.
        """
      end

      unless File.stat!(folder()).access == :read_write do
        raise """
        The folder specified in CERT_DB_DIR does not have write permissions. Please make sure the 
        folder is writable by the user running the server.
        """
      end
    end
  end

  #
  # Returns the name of the issuer of the certificate
  # or :not_ready if the certificate is not yet available
  #
  # In production environment, the certificate is fetched from Let's Encrypt
  # and if everything is OK, the "Let's Encrypt" issuer is returned.
  #
  defp find_issuer_name() do
    config = SiteEncrypt.Registry.config(OperatelyWeb.Endpoint)

    case SiteEncrypt.client(config).pems(config) do
      :error -> :not_ready

      {:ok, pems} ->
        pems.cert 
        |> X509.Certificate.from_pem!() 
        |> X509.Certificate.issuer()
        |> X509.RDNSequence.get_attr("O")
        |> List.first()
    end
  end

end
