# How to generate your own Self Signed SSL Certificate

# Create your very own Root Certificate Authority
openssl genrsa \
-out ca_chain_rca.pem \
2048

# Self-sign your Root Certificate Authority
# Since this is private, the details can be as bogus as you like
openssl req \
-x509 \
-new \
-nodes \
-key ca_chain_rca.pem \
-days 1024 \
-out ca_chain_me.cer \
-subj "/C=US/ST=Utah/L=Provo/O=ACME Signing Authority Inc/CN=example.com"

# Create a Device Certificate for each domain,
# such as example.com, *.example.com, awesome.example.com
# NOTE: You MUST match CN to the domain name or ip address you want to use
openssl genrsa \
-out server_me.pem \
2048

# Create a request from your Device, which your Root CA will sign
openssl req -new \
-key server_me.pem \
-out server_me.csr \
-subj "/C=US/ST=Utah/L=Provo/O=ACME Tech Inc/CN=local.ldsconnect.org"

# Sign the request from Device with your Root CA
openssl x509 \
-req -in server_me.csr \
-CA ca_chain_me.cer \
-CAkey ca_chain_rca.pem \
-CAcreateserial \
-out server_me.cer \
-days 500
